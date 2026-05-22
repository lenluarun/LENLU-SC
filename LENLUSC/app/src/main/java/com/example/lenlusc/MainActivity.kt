package com.example.lenlusc

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode = android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        
        webView = WebView(this)
        setContentView(webView)

        // Handle Back button
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.mediaPlaybackRequiresUserGesture = false
        
        // Enable hardware acceleration
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null)

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                injectStatusHeight()
            }
        }

        webView.addJavascriptInterface(WebAppInterface(this), "AndroidInterface")

        webView.loadUrl("file:///android_asset/index.html")
    }

    private fun injectStatusHeight() {
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { _, insets ->
            val statusBarInsets = insets.getInsets(WindowInsetsCompat.Type.statusBars())
            val density = resources.displayMetrics.density
            val topInsetDp = statusBarInsets.top / density
            webView.evaluateJavascript("document.documentElement.style.setProperty('--status-bar-height', '${topInsetDp}px');", null)
            insets
        }
        // Force an inset dispatch
        ViewCompat.requestApplyInsets(window.decorView)
    }

    class WebAppInterface(private val activity: MainActivity) {
        
        @JavascriptInterface
        fun runNativeScan(type: String) {
            // Placeholder for native scan logic
        }

        @JavascriptInterface
        fun openUrl(url: String) {
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                activity.startActivity(intent)
            } catch (e: Exception) {
                activity.runOnUiThread {
                    Toast.makeText(activity, "Could not open link", Toast.LENGTH_SHORT).show()
                }
            }
        }

        @JavascriptInterface
        fun sendEmail(subject: String, body: String) {
            val intent = Intent(Intent.ACTION_SENDTO).apply {
                data = Uri.parse("mailto:")
                putExtra(Intent.EXTRA_EMAIL, arrayOf("lenluarun@gmail.com"))
                putExtra(Intent.EXTRA_SUBJECT, subject)
                putExtra(Intent.EXTRA_TEXT, body)
            }
            try {
                activity.startActivity(Intent.createChooser(intent, "Send Email via..."))
            } catch (e: Exception) {
                activity.runOnUiThread {
                    Toast.makeText(activity, "No email client found", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
