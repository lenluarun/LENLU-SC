# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class com.lenlu.sc.WebAppInterface {
#   public *;
#}

# Keep - Applications that use WebView with JavaScript interfaces
-keepclassmembers class com.lenlu.sc.WebAppInterface {
    public *;
}

# Keep notification worker classes
-keep class com.lenlu.sc.NotificationWorker { *; }
-keep class com.lenlu.sc.BootReceiver { *; }

# Keep MainActivity and its methods
-keep class com.lenlu.sc.MainActivity { *; }

# Keep names for WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep R8/ProGuard from removing classes referenced only in layout XML
-keepclassmembers class ** {
    @androidx.annotation.Keep *;
}