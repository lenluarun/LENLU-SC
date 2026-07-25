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
