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
        private const val ACTIVE_WORK_TAG = "lenlu_active_notif"

        // 5 categories of daily random notifications
        private val NOTIFICATION_POOL = listOf(
            // System Status Alerts
            NotifTemplate(
                "\u26a1 SYSTEM PULSE",
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
                "All six cyber modules online. Dashboard, Compiler, Neural, Scanner, Network, Vault \u2014 GO.",
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
