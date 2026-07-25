package com.lenlu.sc

import android.Manifest
import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var drawerLayout: androidx.drawerlayout.widget.DrawerLayout
    private lateinit var bottomNav: com.google.android.material.bottomnavigation.BottomNavigationView
    private lateinit var navView: com.google.android.material.navigation.NavigationView
    private lateinit var statusBarOverlay: View

    private var topInsetPx = 0
    private var bottomInsetPx = 0
    private lateinit var wifiManager: WifiManager
    private var isUpdatingNav = false

    private val requiredPermissions = mutableListOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.ACCESS_WIFI_STATE,
        Manifest.permission.CHANGE_WIFI_STATE,
        Manifest.permission.VIBRATE
    ).apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            add(Manifest.permission.BLUETOOTH_SCAN)
            add(Manifest.permission.BLUETOOTH_CONNECT)
        } else {
            add(Manifest.permission.BLUETOOTH)
            add(Manifest.permission.BLUETOOTH_ADMIN)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.NEARBY_WIFI_DEVICES)
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }.toTypedArray()

    private val wifiScanReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            sendWifiResultsToJs()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen BEFORE super.onCreate
        installSplashScreen()

        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // --- EDGE-TO-EDGE SETUP ---
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.BLACK

        // Dark status bar icons = false → white icons on dark background
        val insetsController = WindowInsetsControllerCompat(window, window.decorView)
        insetsController.isAppearanceLightStatusBars = false
        insetsController.isAppearanceLightNavigationBars = false

        // Handle display cutout (notch)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }

        // --- VIEWS ---
        drawerLayout = findViewById(R.id.drawer_layout)
        bottomNav = findViewById(R.id.bottom_navigation)
        navView = findViewById(R.id.nav_view)
        webView = findViewById(R.id.webView)
        statusBarOverlay = findViewById(R.id.status_bar_overlay)

        wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

        // --- WEBVIEW SETTINGS ---
        setupWebView()

        // --- SYSTEM INSETS ---
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { _, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            val cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout())

            topInsetPx = maxOf(systemBars.top, cutout.top)
            bottomInsetPx = systemBars.bottom

            // Status bar overlay height = actual status bar height
            val params = statusBarOverlay.layoutParams
            params.height = topInsetPx
            statusBarOverlay.layoutParams = params

            // Bottom nav padding to avoid nav bar overlap
            bottomNav.setPadding(0, 0, 0, bottomInsetPx)

            // Push inset values to WebView JS for CSS safe area variables
            updateSafeInsets()
            insets
        }

        // --- BOTTOM NAV ---
        bottomNav.setOnItemSelectedListener { item ->
            if (!isUpdatingNav) navigateToView(viewIdFromItemId(item.itemId))
            true
        }

        // --- DRAWER NAV ---
        navView.setNavigationItemSelectedListener { item ->
            if (!isUpdatingNav) navigateToView(viewIdFromItemId(item.itemId))
            drawerLayout.closeDrawers()
            true
        }

        // --- LOAD WEB APP ---
        webView.loadUrl("file:///android_asset/index.html")

        // --- WIFI RECEIVER ---
        val intentFilter = IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION)
        registerReceiver(wifiScanReceiver, intentFilter)

        // --- PERMISSIONS & NOTIFICATIONS ---
        checkAndRequestPermissions()

        // --- NOTIFICATIONS ---
        NotificationWorker.createNotificationChannel(this)
        NotificationWorker.scheduleDailyNotifications(this)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.databaseEnabled = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.mediaPlaybackRequiresUserGesture = false

        // Hardware acceleration for WebGL
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        webView.addJavascriptInterface(WebAppInterface(this, webView), "Android")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                updateSafeInsets()
                webView.evaluateJavascript("if(window.updateAndroidInfo) updateAndroidInfo()", null)
                // Inject device info for the web app
                injectDeviceCapabilities()
            }
        }
        webView.webChromeClient = object : WebChromeClient() {}
    }

    private fun injectDeviceCapabilities() {
        val js = """
            window.__ANDROID_NOTCH_HEIGHT_PX__ = $topInsetPx;
            window.__ANDROID_NAV_HEIGHT_PX__ = $bottomInsetPx;
            if (window.updateAndroidInfo) updateAndroidInfo();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    private fun navigateToView(viewName: String) {
        webView.evaluateJavascript(
            "if(window.switchView) switchView('$viewName', document.querySelector('[data-view=$viewName]'))",
            null
        )
    }

    private fun viewIdFromItemId(itemId: Int): String = when (itemId) {
        R.id.nav_home -> "home"
        R.id.nav_dashboard -> "dashboard"
        R.id.nav_compiler -> "compiler"
        R.id.nav_neural -> "neural"
        R.id.nav_scanner -> "scanner"
        R.id.nav_network -> "network"
        R.id.nav_encoder -> "encoder"
        R.id.nav_keymap -> "keymap"
        R.id.nav_osint -> "osint"
        R.id.nav_vault -> "vault"
        R.id.nav_history -> "history"
        R.id.nav_terminal -> "terminal"
        R.id.nav_speedtest -> "speedtest"
        R.id.nav_clipboard -> "clipboard"
        R.id.nav_whois -> "whois"
        R.id.nav_settings -> "settings"
        else -> "home"
    }

    fun openDrawer() {
        drawerLayout.openDrawer(androidx.core.view.GravityCompat.START)
    }

    fun updateNavigationSelection(viewName: String) {
        val itemId = when (viewName) {
            "home" -> R.id.nav_home
            "dashboard" -> R.id.nav_dashboard
            "compiler" -> R.id.nav_compiler
            "neural" -> R.id.nav_neural
            "scanner" -> R.id.nav_scanner
            "network" -> R.id.nav_network
            "encoder" -> R.id.nav_encoder
            "keymap" -> R.id.nav_keymap
            "osint" -> R.id.nav_osint
            "vault" -> R.id.nav_vault
            "history" -> R.id.nav_history
            "terminal" -> R.id.nav_terminal
            "speedtest" -> R.id.nav_speedtest
            "clipboard" -> R.id.nav_clipboard
            "whois" -> R.id.nav_whois
            "settings" -> R.id.nav_settings
            else -> -1
        }
        if (itemId != -1) {
            isUpdatingNav = true
            runOnUiThread {
                bottomNav.selectedItemId = itemId
                navView.setCheckedItem(itemId)
            }
            isUpdatingNav = false
        }
    }

    fun triggerWifiScan() {
        @Suppress("DEPRECATION")
        val success = wifiManager.startScan()
        if (!success) sendWifiResultsToJs()
    }

    private fun sendWifiResultsToJs() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED) {
            val results = wifiManager.scanResults
            val jsonArray = JSONArray()
            for (res in results) {
                val obj = JSONObject()
                obj.put("ssid", res.SSID)
                obj.put("bssid", res.BSSID)
                obj.put("level", res.level)
                obj.put("frequency", res.frequency)
                jsonArray.put(obj)
            }
            val base64 = Base64.encodeToString(jsonArray.toString().toByteArray(), Base64.NO_WRAP)
            webView.post {
                webView.evaluateJavascript(
                    "if(window.onWifiScanResultBase64) onWifiScanResultBase64('$base64')",
                    null
                )
            }
        }
    }

    private fun updateSafeInsets() {
        val topDp = topInsetPx / resources.displayMetrics.density
        val bottomDp = bottomInsetPx / resources.displayMetrics.density
        val js = """
            document.documentElement.style.setProperty('--safe-top', '${topDp}px');
            document.documentElement.style.setProperty('--safe-bottom', '${bottomDp}px');
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    private fun checkAndRequestPermissions() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), 1002)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 1002) {
            // Re-schedule notifications if POST_NOTIFICATIONS was just granted
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val idx = permissions.indexOf(Manifest.permission.POST_NOTIFICATIONS)
                if (idx >= 0 && grantResults[idx] == PackageManager.PERMISSION_GRANTED) {
                    NotificationWorker.scheduleDailyNotifications(this)
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try { unregisterReceiver(wifiScanReceiver) } catch (e: Exception) {}
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        when {
            drawerLayout.isDrawerOpen(androidx.core.view.GravityCompat.START) ->
                drawerLayout.closeDrawers()
            webView.canGoBack() -> webView.goBack()
            else -> super.onBackPressed()
        }
    }
}
