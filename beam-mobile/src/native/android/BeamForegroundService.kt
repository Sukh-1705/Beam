package com.beam.transfer

import android.app.*
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * BeamForegroundService maintains active background throughput for multi-gigabyte transfers
 * on Android, preventing the OS from killing the process during app switching or screen lock.
 */
class BeamForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "beam_transfer_channel"
        const val NOTIFICATION_ID = 5331
        const val ACTION_START_TRANSFER = "com.beam.action.START"
        const val ACTION_STOP_TRANSFER = "com.beam.action.STOP"
        const val EXTRA_FILE_NAME = "extra_file_name"
        const val EXTRA_PERCENT = "extra_percent"
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: WifiManager.WifiLock? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        // Acquire WakeLock & High-Perf Wi-Fi Lock to saturate connection
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Beam::TransferWakeLock"
        ).apply { setReferenceCounted(false) }

        val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        wifiLock = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            wifiManager.createWifiLock(WifiManager.WIFI_MODE_FULL_LOW_LATENCY, "Beam::WifiLock")
        } else {
            @Suppress("DEPRECATION")
            wifiManager.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "Beam::WifiLock")
        }.apply { setReferenceCounted(false) }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_TRANSFER -> {
                val fileName = intent.getStringExtra(EXTRA_FILE_NAME) ?: "Files"
                val percent = intent.getIntExtra(EXTRA_PERCENT, 0)

                wakeLock?.acquire(3 * 60 * 60 * 1000L) // 3 hour safety cap for 100GB transfers
                wifiLock?.acquire()

                val notification = buildProgressNotification(fileName, percent)
                startForeground(NOTIFICATION_ID, notification)
            }
            ACTION_STOP_TRANSFER -> {
                releaseLocks()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun buildProgressNotification(fileName: String, percent: Int): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Beaming $fileName")
            .setContentText("$percent% completed · Link saturating (Wi-Fi 6)")
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setProgress(100, percent, false)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Beam File Transfers",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows real-time progress for active high-speed transfers"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun releaseLocks() {
        if (wakeLock?.isHeld == true) wakeLock?.release()
        if (wifiLock?.isHeld == true) wifiLock?.release()
    }

    override fun onDestroy() {
        releaseLocks()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
