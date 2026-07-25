# 🤖 ANDROID STUDIO AI PROMPT — LENLU SC v4.0 APK UPGRADE

> **Copy this entire prompt and paste it into Android Studio's AI assistant (Gemini in Android Studio / Claude), or use it as a specification document to implement yourself.**

---

## 📋 CONTEXT & PROJECT OVERVIEW

I have an existing Android project at `appp/` inside the LENLU-SC repository. The app is a **WebView wrapper** for a cyberpunk-themed hacker command console web app. Here is the current state:

- **Package**: `com.lenlu.sc`
- **compileSdk**: 34, **minSdk**: 24, **targetSdk**: 34
- **Theme**: Full black (`#030804`) background + Matrix green (`#00FF41`) accent + cyan (`#08F7FE`) secondary
- **Main files**: `MainActivity.kt`, `WebAppInterface.kt`
- **The WebView** loads `file:///android_asset/index.html` — a single-file compiled web app
- **Existing features**: BLE scan, WiFi scan, clipboard, file save/share, vibration, system info bridge

---

## 🎯 TASK: COMPLETE APK UPGRADE

Please implement ALL of the following upgrades to the existing Android project. Keep all existing functionality working. This is a complete, production-ready fine-tune pass.

---

## 1. 📦 GRADLE DEPENDENCIES UPDATE

Update `appp/build.gradle` to add these dependencies:

```gradle
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace 'com.lenlu.sc'
    compileSdk 34

    defaultConfig {
        applicationId "com.lenlu.sc"
        minSdk 24
        targetSdk 34
        versionCode 4
        versionName "4.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            versionNameSuffix "-debug"
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = '1.8'
    }
    buildFeatures {
        viewBinding true
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.drawerlayout:drawerlayout:1.2.0'

    // WorkManager for background notification scheduling
    implementation 'androidx.work:work-runtime-ktx:2.9.0'

    // Splash Screen API
    implementation 'androidx.core:core-splashscreen:1.0.1'

    // Notification channels & compat
    implementation 'androidx.core:core-ktx:1.12.0'

    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
```

---

## 2. 📋 ANDROIDMANIFEST.XML — FULL REWRITE

Replace `appp/src/main/AndroidManifest.xml` with:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Network -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- WiFi -->
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES"
        android:usesPermissionFlags="neverForLocation" />

    <!-- Bluetooth -->
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN"
        android:usesPermissionFlags="neverForLocation" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

    <!-- Haptics -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- Notifications (Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Boot receiver for rescheduling notifications after reboot -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/app_icon"
        android:label="LENLU SC"
        android:roundIcon="@drawable/app_icon"
        android:supportsRtl="true"
        android:theme="@style/Theme.LENLUSC.Splash"
        android:hardwareAccelerated="true">

        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout"
            android:windowSoftInputMode="adjustResize"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- WorkManager notification worker -->
        <provider
            android:name="androidx.startup.InitializationProvider"
            android:authorities="${applicationId}.androidx-startup"
            android:exported="false"
            tools:node="merge"
            xmlns:tools="http://schemas.android.com/tools">
            <meta-data
                android:name="androidx.work.WorkManagerInitializer"
                android:value="androidx.startup" />
        </provider>

        <!-- FileProvider for file sharing -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/filepaths" />
        </provider>

        <!-- Boot completed receiver -->
        <receiver
            android:name=".BootReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>
```

---

## 3. 🎨 THEME & STYLES — `res/values/themes.xml`

Replace with:

```xml
<resources xmlns:tools="http://schemas.android.com/tools">

    <!-- Splash Screen wrapper theme -->
    <style name="Theme.LENLUSC.Splash" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">#030804</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/app_icon</item>
        <item name="windowSplashScreenAnimationDuration">800</item>
        <item name="postSplashScreenTheme">@style/Theme.LENLUSC</item>
    </style>

    <!-- Main App Theme -->
    <style name="Theme.LENLUSC" parent="Theme.MaterialComponents.NoActionBar">
        <item name="colorPrimary">@color/matrix_green</item>
        <item name="colorPrimaryVariant">@color/matrix_green_dim</item>
        <item name="colorOnPrimary">@color/black</item>
        <item name="colorSecondary">@color/cyan</item>
        <item name="colorSecondaryVariant">@color/cyan</item>
        <item name="colorOnSecondary">@color/black</item>

        <!-- Transparent status bar — content draws behind it -->
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@color/black</item>
        <item name="android:windowBackground">@color/black</item>
        <item name="android:colorBackground">@color/black</item>
        <item name="android:textColorPrimary">@color/matrix_green</item>
        <item name="android:textColorSecondary">@color/muted</item>

        <item name="alertDialogTheme">@style/Theme.LENLUSC.Dialog</item>
        <item name="colorControlHighlight">@color/matrix_green_alpha</item>
        <item name="colorControlActivated">@color/matrix_green</item>
        <item name="android:textColorHighlight">@color/matrix_green_alpha</item>
        <item name="android:textSelectHandle">@color/matrix_green</item>
        <item name="android:textSelectHandleLeft">@color/matrix_green</item>
        <item name="android:textSelectHandleRight">@color/matrix_green</item>

        <!-- Edge-to-edge: draw behind status and nav bars -->
        <item name="android:windowLayoutInDisplayCutoutMode" tools:targetApi="o_mr1">shortEdges</item>
    </style>

    <style name="Theme.LENLUSC.Dialog" parent="Theme.MaterialComponents.Dialog.Alert">
        <item name="android:background">@color/base2</item>
        <item name="android:windowBackground">@color/base2</item>
        <item name="android:textColorPrimary">@color/white</item>
        <item name="colorAccent">@color/matrix_green</item>
        <item name="android:backgroundDimEnabled">true</item>
        <item name="shapeAppearanceLargeComponent">@style/ShapeAppearance.LENLUSC.MediumComponent</item>
    </style>

    <style name="ShapeAppearance.LENLUSC.MediumComponent" parent="ShapeAppearance.MaterialComponents.MediumComponent">
        <item name="cornerFamily">rounded</item>
        <item name="cornerSize">4dp</item>
    </style>
</resources>
```

---

## 4. 🎨 COLORS — `res/values/colors.xml`

Replace with:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="black">#030804</color>
    <color name="matrix_green">#00FF41</color>
    <color name="matrix_green_dim">#007A20</color>
    <color name="matrix_green_alpha">#4000FF41</color>
    <color name="cyan">#08F7FE</color>
    <color name="red">#FF2D55</color>
    <color name="amber">#FFB300</color>
    <color name="white">#FFFFFF</color>
    <color name="muted">#4A5A4A</color>
    <color name="base2">#0D1A0D</color>
    <color name="surface">#0A140A</color>
    <color name="nav_bg">#050F05</color>
    <color name="notification_accent">#00FF41</color>
</resources>
```

---

## 5. 📐 LAYOUT — `res/layout/activity_main.xml`

Replace with a full edge-to-edge layout that handles notch/cutout, status bar overlay, and bottom nav:

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.drawerlayout.widget.DrawerLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/drawer_layout"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fitsSystemWindows="false"
    android:background="@color/black"
    tools:context=".MainActivity">

    <!-- Main content area -->
    <androidx.coordinatorlayout.widget.CoordinatorLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:fitsSystemWindows="false">

        <!-- Full-screen WebView — draws behind status bar & nav bar -->
        <WebView
            android:id="@+id/webView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:background="@color/black"
            android:overScrollMode="never"
            android:scrollbarStyle="insideOverlay"
            android:scrollbars="none"
            android:fitsSystemWindows="false" />

        <!-- Frosted status bar overlay with matrix green tint -->
        <View
            android:id="@+id/status_bar_overlay"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:alpha="0.72"
            android:background="#030804" />

        <!-- Bottom Navigation Bar -->
        <com.google.android.material.bottomnavigation.BottomNavigationView
            android:id="@+id/bottom_navigation"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_gravity="bottom"
            android:background="@color/nav_bg"
            app:itemIconTint="@color/nav_item_color"
            app:itemTextColor="@color/nav_item_color"
            app:itemActiveIndicatorColor="@color/matrix_green_alpha"
            app:labelVisibilityMode="selected"
            app:menu="@menu/bottom_nav_menu"
            android:elevation="8dp" />

    </androidx.coordinatorlayout.widget.CoordinatorLayout>

    <!-- Navigation Drawer (slides from left) -->
    <com.google.android.material.navigation.NavigationView
        android:id="@+id/nav_view"
        android:layout_width="280dp"
        android:layout_height="match_parent"
        android:layout_gravity="start"
        android:background="@color/nav_bg"
        android:fitsSystemWindows="true"
        app:headerLayout="@layout/nav_header"
        app:itemIconTint="@color/nav_item_color"
        app:itemTextColor="@color/nav_item_color"
        app:menu="@menu/drawer_nav_menu" />

</androidx.drawerlayout.widget.DrawerLayout>
```

---

## 6. 🧭 NAV HEADER — `res/layout/nav_header.xml`

Create `res/layout/nav_header.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:background="@color/base2"
    android:paddingStart="20dp"
    android:paddingEnd="20dp"
    android:paddingBottom="16dp">

    <!-- Top padding for status bar inset (set programmatically) -->
    <Space android:id="@+id/header_status_space"
        android:layout_width="match_parent"
        android:layout_height="24dp" />

    <ImageView
        android:layout_width="56dp"
        android:layout_height="56dp"
        android:src="@drawable/app_icon"
        android:layout_marginBottom="8dp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="LENLU SC"
        android:textColor="#00FF41"
        android:textSize="18sp"
        android:fontFamily="monospace"
        android:letterSpacing="0.15" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="CYBERNETIC FORGE v4.0"
        android:textColor="#4A5A4A"
        android:textSize="11sp"
        android:fontFamily="monospace"
        android:letterSpacing="0.08" />

    <!-- Separator line -->
    <View
        android:layout_width="match_parent"
        android:layout_height="1dp"
        android:layout_marginTop="12dp"
        android:background="#1A00FF41" />

</LinearLayout>
```

---

## 7. 🎨 COLOR SELECTOR — `res/color/nav_item_color.xml`

Create `res/color/nav_item_color.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<selector xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:color="#00FF41" android:state_checked="true" />
    <item android:color="#00FF41" android:state_selected="true" />
    <item android:color="#4A5A4A" />
</selector>
```

---

## 8. 🔔 NOTIFICATION WORKER — Create `NotificationWorker.kt`

Create `appp/src/main/java/com/lenlu/sc/NotificationWorker.kt`:

```kotlin
package com.lenlu.sc

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.*
import java.util.concurrent.TimeUnit
import kotlin.random.Random

class NotificationWorker(context: Context, params: WorkerParameters) : Worker(context, params) {

    companion object {
        const val CHANNEL_ID = "lenlu_forge_alerts"
        const val CHANNEL_NAME = "LENLU SC Forge Alerts"
        private const val NOTIFICATION_BASE_ID = 1001

        // 5 categories of daily random notifications
        private val NOTIFICATION_POOL = listOf(
            // System Status Alerts
            NotifTemplate(
                "⚡ SYSTEM PULSE",
                "Neural uplink stable. DuckyScript compiler pipeline at 100% efficiency. All modules nominal.",
                "system"
            ),
            NotifTemplate(
                "🔐 VAULT STATUS",
                "Encrypted payload vault integrity verified. AES-256 cipher block operational.",
                "system"
            ),
            NotifTemplate(
                "🛡️ SECURITY AUDIT",
                "Stealth calibrator scan complete. No anomalies detected in local execution sandbox.",
                "security"
            ),
            // Intelligence Briefings
            NotifTemplate(
                "📡 SIGNAL DETECTED",
                "BLE beacon activity detected nearby. Open LENLU SC scanner to investigate active nodes.",
                "scanner"
            ),
            NotifTemplate(
                "🌐 NETWORK RECON",
                "New DNS intelligence available. Check your Network HUD for updated ISP telemetry.",
                "network"
            ),
            NotifTemplate(
                "🔍 OSINT ALERT",
                "Browser fingerprint entropy spike detected. Review your stealth score in the OSINT module.",
                "osint"
            ),
            // Payload Tips
            NotifTemplate(
                "💡 PAYLOAD TIP",
                "Pro tip: Use DEFAULTDELAY to set a global keystroke timing for all STRING commands in your script.",
                "tip"
            ),
            NotifTemplate(
                "💡 DUCKYSCRIPT PRO",
                "Use FUNCTION blocks in DuckyScript 3.0 to create reusable keystroke injection sequences.",
                "tip"
            ),
            NotifTemplate(
                "🧠 NEURAL SYNTHESIS",
                "AI payload generator ready. Describe your target behavior and let the neural engine write it.",
                "ai"
            ),
            // Activity Reminders
            NotifTemplate(
                "⚡ FORGE ACTIVE",
                "LENLU SC command deck standing by. Your last session payload is saved in the vault.",
                "reminder"
            ),
            NotifTemplate(
                "🕶️ OPERATOR READY",
                "All six cyber modules online. Dashboard, Compiler, Neural, Scanner, Network, Vault — GO.",
                "reminder"
            ),
            NotifTemplate(
                "🔧 BUILD COMPLETE",
                "Compilation pipeline ready. Open the IDE to run your DuckyScript through the AutoIt3 assembler.",
                "compiler"
            ),
            // Cyber-themed daily status
            NotifTemplate(
                "📊 SESSION METRICS",
                "System uptime nominal. Matrix rain density optimal. WebGL shaders rendering at 60 FPS target.",
                "status"
            ),
            NotifTemplate(
                "🌍 GEO-IP PULSE",
                "Location telemetry refreshed. Network latency within acceptable parameters for clean operations.",
                "network"
            ),
            NotifTemplate(
                "⚙️ MODULE SYNC",
                "All 11 forge modules synchronized. Keymap visualizer, hash cracker, and clipboard bridge online.",
                "system"
            )
        )

        fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "LENLU SC system alerts, payload tips, and cyber intelligence briefings"
                    enableLights(true)
                    lightColor = Color.parseColor("#00FF41")
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 80, 80, 80)
                    lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                }
                val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                manager.createNotificationChannel(channel)
            }
        }

        /**
         * Schedule 5 notifications spread across the day using WorkManager
         * Sends at: ~8AM, ~11AM, ~2PM, ~5PM, ~8PM (with random ±30min jitter)
         */
        fun scheduleDailyNotifications(context: Context) {
            val workManager = WorkManager.getInstance(context)
            workManager.cancelAllWorkByTag("lenlu_daily_notif")

            val notifTimes = listOf(480L, 660L, 840L, 1020L, 1200L) // minutes from midnight
            val now = System.currentTimeMillis()
            val midnight = now - (now % (24 * 60 * 60 * 1000))

            notifTimes.forEachIndexed { index, minutesFromMidnight ->
                val jitter = Random.nextLong(-30, 30) // ±30 min jitter
                val targetTime = midnight + (minutesFromMidnight + jitter) * 60 * 1000
                val delay = if (targetTime > now) targetTime - now else targetTime + 24 * 60 * 60 * 1000 - now

                val data = workDataOf(
                    "notif_slot" to index,
                    "notif_index" to Random.nextInt(NOTIFICATION_POOL.size)
                )

                val request = OneTimeWorkRequestBuilder<NotificationWorker>()
                    .setInitialDelay(delay, TimeUnit.MILLISECONDS)
                    .setInputData(data)
                    .addTag("lenlu_daily_notif")
                    .addTag("lenlu_slot_$index")
                    .build()

                workManager.enqueue(request)
            }
        }
    }

    override fun doWork(): Result {
        val slot = inputData.getInt("notif_slot", 0)
        val notifIdx = inputData.getInt("notif_index", Random.nextInt(NOTIFICATION_POOL.size))

        val template = NOTIFICATION_POOL[notifIdx % NOTIFICATION_POOL.size]
        sendNotification(applicationContext, template, NOTIFICATION_BASE_ID + slot)

        // Reschedule this slot for tomorrow
        val data = workDataOf(
            "notif_slot" to slot,
            "notif_index" to Random.nextInt(NOTIFICATION_POOL.size)
        )
        val tomorrow = OneTimeWorkRequestBuilder<NotificationWorker>()
            .setInitialDelay(24, TimeUnit.HOURS)
            .setInputData(data)
            .addTag("lenlu_daily_notif")
            .addTag("lenlu_slot_$slot")
            .build()
        WorkManager.getInstance(applicationContext).enqueue(tomorrow)

        return Result.success()
    }

    private fun sendNotification(context: Context, template: NotifTemplate, id: Int) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context, id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.app_icon)
            .setContentTitle(template.title)
            .setContentText(template.body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(template.body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setColor(Color.parseColor("#00FF41"))
            .setLights(Color.parseColor("#00FF41"), 500, 500)
            .setVibrate(longArrayOf(0, 80, 80, 80))
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .build()

        try {
            NotificationManagerCompat.from(context).notify(id, notification)
        } catch (e: SecurityException) {
            // POST_NOTIFICATIONS not granted yet
        }
    }

    data class NotifTemplate(val title: String, val body: String, val category: String)
}
```

---

## 9. 📡 BOOT RECEIVER — Create `BootReceiver.kt`

Create `appp/src/main/java/com/lenlu/sc/BootReceiver.kt`:

```kotlin
package com.lenlu.sc

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Reschedules daily notifications after device reboot.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            NotificationWorker.createNotificationChannel(context)
            NotificationWorker.scheduleDailyNotifications(context)
        }
    }
}
```

---

## 10. 🚀 UPDATED MAINACTIVITY.KT — FULL REWRITE

Replace the entire `MainActivity.kt` with this complete version that handles:
- Splash screen
- Notch/display cutout (edge-to-edge with safe area insets)
- Transparent status bar with light icons
- Status bar overlay for readability  
- Notification permission request (Android 13+)
- WorkManager notification scheduling
- ViewBinding
- All existing features preserved

```kotlin
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
```

---

## 11. 📱 ADDITIONAL WEBAPPINTERFACE METHOD — Add to `WebAppInterface.kt`

Add these new `@JavascriptInterface` methods to the existing `WebAppInterface.kt`:

```kotlin
@JavascriptInterface
fun sendTestNotification() {
    NotificationWorker.createNotificationChannel(mContext)
    // Send a test notification immediately
    val intent = Intent(mContext, MainActivity::class.java)
    val pendingIntent = PendingIntent.getActivity(
        mContext, 9999, intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val notification = NotificationCompat.Builder(mContext, NotificationWorker.CHANNEL_ID)
        .setSmallIcon(R.drawable.app_icon)
        .setContentTitle("⚡ FORGE UPLINK TEST")
        .setContentText("Notification system online. 5 daily Intel briefings are scheduled.")
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setContentIntent(pendingIntent)
        .setAutoCancel(true)
        .setColor(Color.parseColor("#00FF41"))
        .build()
    try {
        NotificationManagerCompat.from(mContext).notify(9999, notification)
    } catch (e: SecurityException) {}
}

@JavascriptInterface
fun getNotificationPermissionStatus(): String {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (ActivityCompat.checkSelfPermission(mContext, Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED) "granted" else "denied"
    } else {
        "granted" // Pre-Android 13, always granted
    }
}

@JavascriptInterface
fun openNotificationSettings() {
    val intent = Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
        putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, mContext.packageName)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
    mContext.startActivity(intent)
}
```

---

## 12. 🗂️ MENUS — Verify/Create these menu files

**`res/menu/bottom_nav_menu.xml`** (5 main tabs):
```xml
<?xml version="1.0" encoding="utf-8"?>
<menu xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:id="@+id/nav_home" android:icon="@drawable/ic_home" android:title="Home" />
    <item android:id="@+id/nav_dashboard" android:icon="@drawable/ic_dashboard" android:title="Dash" />
    <item android:id="@+id/nav_compiler" android:icon="@drawable/ic_code" android:title="IDE" />
    <item android:id="@+id/nav_neural" android:icon="@drawable/ic_ai" android:title="Neural" />
    <item android:id="@+id/nav_scanner" android:icon="@drawable/ic_scanner" android:title="Scan" />
</menu>
```

---

## 13. 🏗️ BUILD STEPS

After applying all the above:

1. Run `npm run build` in the project root to regenerate `appp/src/main/assets/index.html`
2. In Android Studio: **Build → Clean Project**, then **Build → Rebuild Project**
3. To install: **Run → Run 'appp'** or `./gradlew :appp:installDebug`
4. To build release APK: `./gradlew :appp:assembleRelease`

---

## 14. 🔑 KEY BEHAVIORS TO VERIFY

| Feature | How to Test |
|---|---|
| Notch/cutout safe area | Open app on any notch device — status bar content must be visible above notch |
| Status bar icons white | Status bar icons should be white/light on dark background |
| Edge-to-edge WebView | WebView content should draw behind status bar, with CSS `--safe-top` offsetting it |
| Bottom nav above nav bar | Bottom navigation should sit above the system navigation bar |
| 5 daily notifications | Check notification shade after granting POST_NOTIFICATIONS permission |
| Notification scheduling | Notifications should fire ~5 times/day even when app is closed |
| After reboot | Notifications resume after device reboot via BootReceiver |
| Drawer navigation | Left swipe opens full-width drawer with all 16 navigation items |
| BLE scan | "Scanner" tab → BLE scan button triggers native Bluetooth scan |
| WiFi scan | "Scanner" tab → WiFi scan uses native WifiManager |

---

## 15. 📌 THEME CONSISTENCY REQUIREMENTS

All native UI elements must match the web app:

| Element | Color |
|---|---|
| App background | `#030804` (deep black) |
| Primary accent | `#00FF41` (matrix green) |
| Secondary accent | `#08F7FE` (cyan) |
| Danger/alert | `#FF2D55` (red) |
| Text muted | `#4A5A4A` |
| Bottom nav bg | `#050F05` |
| Drawer bg | `#050F05` |
| Status bar | Transparent (content draws through) |
| Notification light | Matrix green (#00FF41) |
| Notification vibration | `[0, 80, 80, 80]` pattern |
