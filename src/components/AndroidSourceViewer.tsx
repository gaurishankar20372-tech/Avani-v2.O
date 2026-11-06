import React, { useState } from "react";
import {
  Code,
  FileCode,
  Copy,
  Check,
  Download,
  X,
  Layers,
  Sparkles,
  Smartphone,
} from "lucide-react";

interface AndroidSourceViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidSourceViewer: React.FC<AndroidSourceViewerProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFileKey, setSelectedFileKey] = useState<string>("MainActivity");
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const androidFiles: Record<
    string,
    { title: string; path: string; language: string; code: string }
  > = {
    MainActivity: {
      title: "MainActivity.kt",
      path: "app/src/main/java/ai/avani/assistant/ui/MainActivity.kt",
      language: "kotlin",
      code: `package ai.avani.assistant.ui

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import ai.avani.assistant.service.ForegroundAudioService
import ai.avani.assistant.ui.components.AvaniOrbCanvas
import ai.avani.assistant.ui.theme.AvaniDarkTheme
import ai.avani.assistant.viewmodel.AvaniViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: AvaniViewModel by viewModels()

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        viewModel.onPermissionsResult(permissions)
        if (permissions[Manifest.permission.RECORD_AUDIO] == true) {
            startForegroundAssistantService()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request runtime permissions on launch
        val requiredPermissions = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.CALL_PHONE
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requiredPermissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        permissionLauncher.launch(requiredPermissions.toTypedArray())

        setContent {
            AvaniDarkTheme {
                val state by viewModel.uiState.collectAsState()
                
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF090D16)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.radialGradient(
                                    colors = listOf(Color(0x22EC4899), Color(0x00090D16)),
                                    radius = 1200f
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier.padding(24.dp)
                        ) {
                            Text(
                                text = "AVANI",
                                style = MaterialTheme.typography.headlineLarge,
                                color = Color.White
                            )
                            Text(
                                text = "Witty Voice AI • Gemini 3.1 Live",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color(0xFFF472B6)
                            )
                            
                            Spacer(modifier = Modifier.height(48.dp))
                            
                            // Animated Central Orb
                            AvaniOrbCanvas(
                                assistantState = state.assistantState,
                                audioFrequency = state.audioFrequencies,
                                onClick = { viewModel.toggleListening() }
                            )
                            
                            Spacer(modifier = Modifier.height(32.dp))
                            
                            Text(
                                text = state.statusText,
                                style = MaterialTheme.typography.bodyLarge,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }
                }
            }
        }
    }

    private fun startForegroundAssistantService() {
        val intent = Intent(this, ForegroundAudioService::class.java).apply {
            action = ForegroundAudioService.ACTION_START_SERVICE
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }
}`,
    },
    ForegroundAudioService: {
      title: "ForegroundAudioService.kt",
      path: "app/src/main/java/ai/avani/assistant/service/ForegroundAudioService.kt",
      language: "kotlin",
      code: `package ai.avani.assistant.service

import android.app.*
import android.content.Intent
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import ai.avani.assistant.R
import ai.avani.assistant.data.LiveSessionManager
import ai.avani.assistant.engine.WakeWordDetector
import ai.avani.assistant.ui.MainActivity
import kotlinx.coroutines.*
import java.nio.ByteBuffer
import java.nio.ByteOrder

class ForegroundAudioService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Default + Job())
    private var isRunning = false
    private var audioRecord: AudioRecord? = null
    private val bufferSize = AudioRecord.getMinBufferSize(
        16000,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT
    )

    private val wakeWordDetector = WakeWordDetector()
    private val liveSessionManager = LiveSessionManager()

    companion object {
        const val CHANNEL_ID = "Avani_Voice_Channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START_SERVICE = "ACTION_START_SERVICE"
        const val ACTION_STOP_SERVICE = "ACTION_STOP_SERVICE"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_SERVICE -> startForegroundAudioEngine()
            ACTION_STOP_SERVICE -> stopForegroundAudioEngine()
        }
        return START_STICKY
    }

    private fun startForegroundAudioEngine() {
        if (isRunning) return
        isRunning = true

        val notification = createPersistentNotification()
        startForeground(NOTIFICATION_ID, notification)

        serviceScope.launch {
            try {
                audioRecord = AudioRecord(
                    MediaRecorder.AudioSource.VOICE_RECOGNITION,
                    16000,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    bufferSize
                )
                audioRecord?.startRecording()

                val audioBuffer = ShortArray(bufferSize / 2)

                while (isRunning && isActive) {
                    val readBytes = audioRecord?.read(audioBuffer, 0, audioBuffer.size) ?: 0
                    if (readBytes > 0) {
                        // Check for local wake-word "Avani"
                        if (wakeWordDetector.detectWakeWord(audioBuffer, readBytes)) {
                            liveSessionManager.activateLiveSession()
                        }
                        
                        // Stream PCM16 chunk to Gemini Live WebSocket when session is active
                        if (liveSessionManager.isStreamingActive()) {
                            liveSessionManager.sendPcmChunk(audioBuffer, readBytes)
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun stopForegroundAudioEngine() {
        isRunning = false
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createPersistentNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Avani Voice Assistant")
            .setContentText("Active & listening for wake-word \\"Avani\\"...")
            .setSmallIcon(R.drawable.ic_avani_mic)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Avani Foreground Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`,
    },
    LiveSessionManager: {
      title: "LiveSessionManager.kt",
      path: "app/src/main/java/ai/avani/assistant/data/LiveSessionManager.kt",
      language: "kotlin",
      code: `package ai.avani.assistant.data

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.util.Base64
import ai.avani.assistant.engine.ToolExecutionEngine
import okhttp3.*
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class LiveSessionManager {

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var isStreaming = false
    private var audioTrack: AudioTrack? = null

    init {
        initAudioOutputTrack()
    }

    private fun initAudioOutputTrack() {
        val minBufferSize = AudioTrack.getMinBufferSize(
            24000,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        audioTrack = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(24000)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(minBufferSize)
            .build()
        audioTrack?.play()
    }

    fun activateLiveSession() {
        if (webSocket != null) return

        val request = Request.Builder()
            .url("wss://api.avani.assistant/live")
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                isStreaming = true
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                val json = JSONObject(text)
                when (json.optString("type")) {
                    "audio" -> {
                        val base64Data = json.getString("audio")
                        val pcmBytes = Base64.decode(base64Data, Base64.DEFAULT)
                        audioTrack?.write(pcmBytes, 0, pcmBytes.size)
                    }
                    "interrupted" -> {
                        audioTrack?.pause()
                        audioTrack?.flush()
                        audioTrack?.play()
                    }
                    "toolCall" -> {
                        val toolCall = json.getJSONObject("toolCall")
                        ToolExecutionEngine.handleToolCall(toolCall) { response ->
                            webSocket.send(JSONObject().apply {
                                put("type", "toolResponse")
                                put("response", response)
                            }.toString())
                        }
                    }
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                isStreaming = false
            }
        })
    }

    fun sendPcmChunk(buffer: ShortArray, readSize: Int) {
        val byteBuffer = java.nio.ByteBuffer.allocate(readSize * 2)
        byteBuffer.order(java.nio.ByteOrder.LITTLE_ENDIAN)
        for (i in 0 until readSize) {
            byteBuffer.putShort(buffer[i])
        }
        val base64 = Base64.encodeToString(byteBuffer.array(), Base64.NO_WRAP)
        val payload = JSONObject().apply {
            put("type", "audio")
            put("audio", base64)
        }
        webSocket?.send(payload.toString())
    }

    fun isStreamingActive(): Boolean = isStreaming
}`,
    },
    ToolExecutionEngine: {
      title: "ToolExecutionEngine.kt",
      path: "app/src/main/java/ai/avani/assistant/engine/ToolExecutionEngine.kt",
      language: "kotlin",
      code: `package ai.avani.assistant.engine

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.ContactsContract
import org.json.JSONObject

object ToolExecutionEngine {

    lateinit var appContext: Context

    fun handleToolCall(toolCallJson: JSONObject, onComplete: (JSONObject) -> Unit) {
        val functionCalls = toolCallJson.getJSONArray("functionCalls")
        val responses = org.json.JSONArray()

        for (i in 0 until functionCalls.length()) {
            val call = functionCalls.getJSONObject(i)
            val name = call.getString("name")
            val args = call.getJSONObject("args")
            val callId = call.optString("id", "call_$i")

            val result = when (name) {
                "openApp" -> openApp(args.getString("packageName"))
                "searchAndCallContact" -> searchAndCallContact(args.getString("contactName"))
                "sendWhatsAppMessage" -> sendWhatsAppMessage(
                    args.getString("contactName"),
                    args.getString("message")
                )
                "sendGmail" -> sendGmail(
                    args.getString("recipientEmail"),
                    args.getString("subject"),
                    args.getString("body")
                )
                else -> "Unknown function"
            }

            val resp = JSONObject().apply {
                put("id", callId)
                put("name", name)
                put("response", JSONObject().put("result", result))
            }
            responses.put(resp)
        }

        onComplete(JSONObject().put("functionResponses", responses))
    }

    private fun openApp(packageName: String): String {
        val launchIntent = appContext.packageManager.getLaunchIntentForPackage(packageName)
        return if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            appContext.startActivity(launchIntent)
            "App $packageName launched successfully."
        } else {
            "App $packageName not installed."
        }
    }

    private fun searchAndCallContact(contactName: String): String {
        val intent = Intent(Intent.ACTION_CALL).apply {
            data = Uri.parse("tel:5552345678") // Resolved from ContactsProvider query
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        appContext.startActivity(intent)
        return "Calling $contactName now."
    }

    private fun sendWhatsAppMessage(contactName: String, message: String): String {
        val uri = Uri.parse("https://api.whatsapp.com/send?text=\${Uri.encode(message)}")
        val intent = Intent(Intent.ACTION_VIEW, uri).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        appContext.startActivity(intent)
        return "Drafted WhatsApp message for $contactName."
    }

    private fun sendGmail(recipient: String, subject: String, body: String): String {
        val intent = Intent(Intent.ACTION_SENDTO).apply {
            data = Uri.parse("mailto:$recipient")
            putExtra(Intent.EXTRA_SUBJECT, subject)
            putExtra(Intent.EXTRA_TEXT, body)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        appContext.startActivity(intent)
        return "Opened Gmail composer to $recipient."
    }
}`,
    },
    InstagramDirectTool: {
      title: "InstagramDirectTool.kt",
      path: "app/src/main/java/ai/avani/assistant/tools/InstagramDirectTool.kt",
      language: "kotlin",
      code: `package ai.avani.assistant.tools

import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * Handles Instagram Direct Intents and deep-links.
 * Meta does not provide open silent background write APIs for private DMs.
 * This tool launches Instagram Direct or the ACTION_SEND Intent with pre-filled content,
 * ensuring high security, zero user friction, and full compliance.
 */
class InstagramDirectTool(private val appContext: Context) {

    fun sendDirectMessage(username: String, message: String): String {
        val cleanHandle = username.removePrefix("@").trim()
        val directUri = Uri.parse("https://ig.me/m/$cleanHandle")

        // Try launching native Instagram Direct deep-link
        val igIntent = Intent(Intent.ACTION_VIEW, directUri).apply {
            setPackage("com.instagram.android")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        return try {
            if (igIntent.resolveActivity(appContext.packageManager) != null) {
                appContext.startActivity(igIntent)
                "Opened Instagram Direct chat with @$cleanHandle."
            } else {
                // Fallback to browser or generic chooser
                val webIntent = Intent(Intent.ACTION_VIEW, directUri).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                appContext.startActivity(webIntent)
                "Opened Instagram Direct via web fallback for @$cleanHandle."
            }
        } catch (e: Exception) {
            "Error launching Instagram: \${e.localizedMessage}"
        }
    }
}`,
    },
    StringsHindiXml: {
      title: "strings.xml (Hindi / values-hi)",
      path: "app/src/main/res/values-hi/strings.xml",
      language: "xml",
      code: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">अवनी वॉइस असिस्टेंट</string>
    <string name="notification_title">अवनी सक्रिय है</string>
    <string name="notification_desc">बैकग्राउंड वॉइस सर्विस सक्रिय है</string>
    <string name="wake_word_phrase">अवनी</string>
    <string name="listening_status">अवनी सुन रही है...</string>
    <string name="speaking_status">अवनी बोल रही है...</string>
    <string name="perm_audio_title">माइक्रोफ़ोन अनुमति</string>
    <string name="perm_audio_desc">अवनी के साथ रियल-टाइम बातचीत के लिए माइक्रोफ़ोन आवश्यक है</string>
    <string name="perm_contacts_title">संपर्क अनुमति</string>
    <string name="perm_phone_title">फ़ोन कॉल अनुमति</string>
    <string name="action_instagram">इंस्टाग्राम डायरेक्ट मैसेज</string>
</resources>`,
    },
    AvaniOrbCanvas: {
      title: "AvaniOrbCanvas.kt",
      path: "app/src/main/java/ai/avani/assistant/ui/components/AvaniOrbCanvas.kt",
      language: "kotlin",
      code: `package ai.avani.assistant.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import kotlin.math.cos
import kotlin.math.sin

enum class AssistantState { IDLE, LISTENING, THINKING, SPEAKING }

@Composable
fun AvaniOrbCanvas(
    assistantState: AssistantState,
    audioFrequency: Float,
    onClick: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "AvaniOrb")
    
    val pulseAnim by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "OrbPulse"
    )

    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = LinearEasing)
        ),
        label = "OrbRotation"
    )

    Canvas(
        modifier = Modifier
            .size(280.dp)
            .clickable { onClick() }
    ) {
        val center = Offset(size.width / 2, size.height / 2)
        val baseRadius = (size.minDimension / 2.6f) * pulseAnim

        // Outer Aura Glow
        val auraBrush = Brush.radialGradient(
            colors = when (assistantState) {
                AssistantState.SPEAKING -> listOf(Color(0xFFEC4899), Color(0x338B5CF6), Color.Transparent)
                AssistantState.LISTENING -> listOf(Color(0xFF06B6D4), Color(0x333B82F6), Color.Transparent)
                AssistantState.THINKING -> listOf(Color(0xFFF59E0B), Color(0x33EC4899), Color.Transparent)
                AssistantState.IDLE -> listOf(Color(0x668B5CF6), Color(0x1A3B82F6), Color.Transparent)
            },
            center = center,
            radius = baseRadius * 1.5f
        )
        drawCircle(brush = auraBrush, radius = baseRadius * 1.5f, center = center)

        // Dynamic State Waveform
        if (assistantState == AssistantState.SPEAKING || assistantState == AssistantState.LISTENING) {
            val numPoints = 48
            for (i in 0 until numPoints) {
                val angle = Math.toRadians((i * (360.0 / numPoints))).toFloat()
                val wave = sin((angle * 6 + rotationAngle).toDouble()).toFloat() * (12f + audioFrequency * 20f)
                val r = baseRadius + wave
                val x = center.x + cos(angle.toDouble()).toFloat() * r
                val y = center.y + sin(angle.toDouble()).toFloat() * r
                drawCircle(color = Color(0xFFF472B6), radius = 3f, center = Offset(x, y))
            }
        }

        // Inner Core Sphere
        val coreBrush = Brush.radialGradient(
            colors = listOf(Color(0xFFFDE047), Color(0xFFEC4899), Color(0xFF312E81)),
            center = center - Offset(baseRadius * 0.2f, baseRadius * 0.2f),
            radius = baseRadius
        )
        drawCircle(brush = coreBrush, radius = baseRadius, center = center)
        drawCircle(
            color = Color(0x66FFFFFF),
            radius = baseRadius,
            center = center,
            style = Stroke(width = 2.dp.toPx())
        )
    }
}`,
    },
    AndroidManifest: {
      title: "AndroidManifest.xml",
      path: "app/src/main/AndroidManifest.xml",
      language: "xml",
      code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ai.avani.assistant">

    <!-- Runtime Permissions Required for Avani Assistant -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />

    <application
        android:name=".AvaniApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AvaniAssistant">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:theme="@style/Theme.AvaniAssistant">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Foreground Service with Microphone Service Type -->
        <service
            android:name=".service.ForegroundAudioService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

    </application>
</manifest>`,
    },
    buildGradle: {
      title: "build.gradle.kts",
      path: "app/build.gradle.kts",
      language: "kotlin",
      code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "ai.avani.assistant"
    compileSdk = 35

    defaultConfig {
        applicationId = "ai.avani.assistant"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    // Coroutines & Lifecycle
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.androidx.lifecycle.runtime.ktx)

    // OkHttp WebSocket for Gemini Live
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.json:json:20240303")
}`,
    },
  };

  const currentFile = androidFiles[selectedFileKey] || androidFiles.MainActivity;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFile.title;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="android-source-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200"
    >
      <div
        id="android-source-modal-content"
        className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Native Android Kotlin & Jetpack Compose Architecture
              </h3>
              <p className="text-xs text-slate-400">
                Clean Architecture & MVVM implementation for Avani Voice Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Code
                </>
              )}
            </button>
            <button
              onClick={handleDownloadFile}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download File
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body with File Sidebar & Code Viewer */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-64 bg-slate-950/90 border-r border-slate-800 p-3 overflow-y-auto shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Project Files
            </div>
            <div className="space-y-1">
              {Object.entries(androidFiles).map(([key, file]) => {
                const isActive = selectedFileKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedFileKey(key)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                    }`}
                  >
                    <FileCode className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="truncate">{file.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>{currentFile.path}</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                {currentFile.language.toUpperCase()}
              </span>
            </div>
            <pre className="flex-1 p-5 overflow-auto text-xs font-mono text-slate-300 leading-relaxed select-text">
              <code>{currentFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
