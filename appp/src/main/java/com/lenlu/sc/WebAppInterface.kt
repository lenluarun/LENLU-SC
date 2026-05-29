package com.lenlu.sc

import android.Manifest
import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

class WebAppInterface(private val mContext: Context, private val webView: WebView) {

    private val bluetoothManager = mContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager.adapter

    @JavascriptInterface
    fun isAndroid(): Boolean = true

    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(mContext, message, Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun vibrate(duration: Long) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = mContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            mContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(duration)
        }
    }

    @JavascriptInterface
    fun getSystemInfo(): String {
        val info = JSONObject()
        info.put("model", Build.MODEL)
        info.put("brand", Build.BRAND)
        info.put("android_ver", Build.VERSION.RELEASE)
        info.put("sdk_int", Build.VERSION.SDK_INT)
        info.put("manufacturer", Build.MANUFACTURER)
        info.put("hardware", Build.HARDWARE)
        info.put("board", Build.BOARD)
        info.put("display", Build.DISPLAY)
        
        val actManager = mContext.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        val memInfo = android.app.ActivityManager.MemoryInfo()
        actManager.getMemoryInfo(memInfo)
        info.put("total_mem", memInfo.totalMem / (1024 * 1024))
        info.put("avail_mem", memInfo.availMem / (1024 * 1024))
        info.put("low_mem", memInfo.lowMemory)
        
        val bm = mContext.getSystemService(Context.BATTERY_SERVICE) as android.os.BatteryManager
        info.put("battery_level", bm.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY))
        
        return info.toString()
    }

    @JavascriptInterface
    fun startWifiScan() {
        (mContext as? MainActivity)?.runOnUiThread {
            mContext.triggerWifiScan()
        }
    }

    @JavascriptInterface
    fun saveFile(filename: String, content: String) {
        try {
            val tempFile = File(mContext.cacheDir, filename)
            FileOutputStream(tempFile).use { it.write(content.toByteArray()) }
            shareFile(tempFile, "text/plain")
        } catch (e: Exception) {
            Toast.makeText(mContext, "Export failed: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    @JavascriptInterface
    fun saveBinaryFile(filename: String, base64Content: String) {
        try {
            val data = Base64.decode(base64Content, Base64.DEFAULT)
            val tempFile = File(mContext.cacheDir, filename)
            FileOutputStream(tempFile).use { it.write(data) }
            shareFile(tempFile, "application/zip")
        } catch (e: Exception) {
            Toast.makeText(mContext, "Export failed: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun shareFile(file: File, mimeType: String) {
        val uri = FileProvider.getUriForFile(mContext, "${mContext.packageName}.fileprovider", file)
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = mimeType
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val chooser = Intent.createChooser(intent, "Export ${file.name}")
        mContext.startActivity(chooser)
    }

    @JavascriptInterface
    fun startBleScan() {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            webView.post {
                webView.evaluateJavascript("onBleError('Bluetooth disabled')", null)
            }
            return
        }

        if (ActivityCompat.checkSelfPermission(mContext, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
            return
        }

        val scanner = bluetoothAdapter.bluetoothLeScanner
        val callback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                val device = result.device
                val obj = JSONObject()
                if (ActivityCompat.checkSelfPermission(mContext, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
                    obj.put("name", device.name ?: "Unknown")
                } else {
                    obj.put("name", "Permission Required")
                }
                obj.put("address", device.address)
                obj.put("rssi", result.rssi)
                
                val base64 = Base64.encodeToString(obj.toString().toByteArray(), Base64.NO_WRAP)
                webView.post {
                    webView.evaluateJavascript("if(window.onBleDeviceFoundBase64) onBleDeviceFoundBase64('$base64')", null)
                }
            }
        }
        
        scanner.startScan(callback)
        Handler(Looper.getMainLooper()).postDelayed({
            if (ActivityCompat.checkSelfPermission(mContext, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED) {
                scanner.stopScan(callback)
            }
        }, 15000)
    }
}
