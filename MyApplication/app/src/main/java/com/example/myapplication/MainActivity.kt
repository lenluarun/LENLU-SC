package com.example.myapplication

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.nativeCanvas
import com.example.myapplication.ui.theme.MyApplicationTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale
import kotlin.math.sin

// --- MODELS ---
data class VaultItem(val name: String, val code: String, val date: String)

sealed class Screen(val label: String, val icon: ImageVector) {
    object Studio : Screen("Studio", Icons.Default.Home)
    object Dash : Screen("Dash", Icons.Default.Info)
    object Build : Screen("Build", Icons.Default.Build)
    object AI : Screen("AI", Icons.Default.Face)
    object Scan : Screen("Scan", Icons.Default.Search)
    object Net : Screen("Net", Icons.Default.Share)
    object Vault : Screen("Vault", Icons.Default.Lock)
    object Config : Screen("Config", Icons.Default.Settings)
}

// --- COLORS ---
val G = Color(0xFF00FF41)
val G_DIM = Color(0xFF007A20)
val CYAN = Color(0xFF08F7FE)
val RED = Color(0xFFFF2D55)
val BASE = Color(0xFF000000)
val BASE1 = Color(0xFF050905)
val BASE2 = Color(0xFF0A0F0B)
val GLASS = Color(0xEB060C08)
val GBORD = Color(0x3800FF41)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { MyApplicationTheme { ForgeApp() } }
    }
}

@Composable
fun ForgeApp() {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("forge_native_v4", Context.MODE_PRIVATE) }
    
    var isBooting by remember { mutableStateOf(true) }
    var bootProgress by remember { mutableStateOf(0f) }
    var bootStatus by remember { mutableStateOf("Initializing Forge...") }
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Studio) }
    
    var statsBuilds by remember { mutableStateOf(prefs.getInt("stats_builds", 0)) }
    var statsOps by remember { mutableStateOf(prefs.getInt("stats_ops", 0)) }
    var statsScans by remember { mutableStateOf(prefs.getInt("stats_scans", 0)) }
    
    val vaultItems = remember { mutableStateListOf<VaultItem>().apply {
        val saved = prefs.getString("vault_json", "[]") ?: "[]"
        try {
            val arr = JSONArray(saved)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                add(VaultItem(obj.getString("name"), obj.getString("code"), obj.getString("date")))
            }
        } catch(e: Exception) {}
    }}
    
    var cfgCrt by remember { mutableStateOf(prefs.getBoolean("cfg_crt", true)) }
    var cfgRain by remember { mutableStateOf(prefs.getBoolean("cfg_rain", true)) }
    var cfgHaptic by remember { mutableStateOf(prefs.getBoolean("cfg_haptic", true)) }

    fun haptic() {
        if (!cfgHaptic) return
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION") context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(15, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION") vibrator.vibrate(15)
        }
    }

    LaunchedEffect(Unit) {
        val stages = listOf("Mounting Core...", "Linking Neural...", "Syncing Forge...", "Ready.")
        while (bootProgress < 1f) {
            delay(120)
            bootProgress += (Math.random() * 0.15).toFloat()
            bootStatus = stages[((bootProgress * 3).toInt()).coerceAtMost(3)]
        }
        bootProgress = 1f; delay(400); isBooting = false
    }

    Box(modifier = Modifier.fillMaxSize().background(BASE)) {
        if (cfgRain) MatrixRain()
        
        AnimatedVisibility(visible = isBooting, exit = fadeOut()) { SplashScreen(bootProgress, bootStatus) }

        if (!isBooting) {
            Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
                TopNav(currentScreen) { haptic(); currentScreen = it }
                Box(modifier = Modifier.weight(1f)) {
                    Crossfade(targetState = currentScreen) { screen ->
                        when (screen) {
                            Screen.Studio -> StudioView { currentScreen = it }
                            Screen.Dash -> DashView(statsBuilds, statsOps, vaultItems.size, statsScans)
                            Screen.Build -> BuildView { statsBuilds++; prefs.edit().putInt("stats_builds", statsBuilds).apply() }
                            Screen.AI -> AIView { statsOps++; prefs.edit().putInt("stats_ops", statsOps).apply() }
                            Screen.Scan -> ScanView { statsScans++; prefs.edit().putInt("stats_scans", statsScans).apply() }
                            Screen.Net -> NetView()
                            Screen.Vault -> VaultView(vaultItems, { n, c -> vaultItems.add(VaultItem(n, c, "2026-02-19")); prefs.edit().putString("vault_json", JSONArray(vaultItems.map { JSONObject().apply { put("name", it.name); put("code", it.code); put("date", it.date) } }).toString()).apply() }, { i -> vaultItems.removeAt(i); prefs.edit().putString("vault_json", JSONArray(vaultItems.map { JSONObject().apply { put("name", it.name); put("code", it.code); put("date", it.date) } }).toString()).apply() })
                            Screen.Config -> ConfigView(cfgCrt, { cfgCrt = it; prefs.edit().putBoolean("cfg_crt", it).apply() }, cfgRain, { cfgRain = it; prefs.edit().putBoolean("cfg_rain", it).apply() }, cfgHaptic, { cfgHaptic = it; prefs.edit().putBoolean("cfg_haptic", it).apply() }) { prefs.edit().clear().apply(); (context as? ComponentActivity)?.let { it.finish(); it.startActivity(it.intent) } }
                        }
                    }
                }
            }
        }
        if (cfgCrt) CRTOverlay()
    }
}

@Composable
fun SplashScreen(p: Float, s: String) {
    Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Icon(Icons.Default.Build, "", modifier = Modifier.size(80.dp), tint = G)
        Text("LENLU SC", color = G, fontSize = 32.sp, fontWeight = FontWeight.Black, letterSpacing = 6.sp)
        Text("FORGE V3.0", color = G_DIM, fontSize = 10.sp, letterSpacing = 3.sp)
        Spacer(Modifier.height(40.dp))
        LinearProgressIndicator(progress = { p }, modifier = Modifier.width(200.dp).height(2.dp), color = G, trackColor = BASE2)
        Text(s.uppercase(), color = G_DIM, fontSize = 9.sp, modifier = Modifier.padding(top = 10.dp))
    }
}

@Composable
fun TopNav(selected: Screen, onSelect: (Screen) -> Unit) {
    Column(modifier = Modifier.background(BASE2.copy(0.95f))) {
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("LENLU SC", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
            Text("ONLINE", color = G_DIM, fontSize = 9.sp)
        }
        Row(modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 8.dp, vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf(Screen.Studio, Screen.Dash, Screen.Build, Screen.AI, Screen.Scan, Screen.Net, Screen.Vault, Screen.Config).forEach { screen ->
                Button(onClick = { onSelect(screen) }, colors = ButtonDefaults.buttonColors(containerColor = if (selected == screen) G else Color.Transparent, contentColor = if (selected == screen) Color.Black else Color(0xFF6B8C74)), shape = RoundedCornerShape(4.dp), contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp), modifier = Modifier.height(34.dp), border = if (selected != screen) BorderStroke(1.dp, GBORD) else null) {
                    Icon(screen.icon, "", modifier = Modifier.size(14.dp)); Spacer(Modifier.width(6.dp)); Text(screen.label.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        HorizontalDivider(color = GBORD)
    }
}

@Composable
fun StudioView(onNav: (Screen) -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Spacer(Modifier.height(60.dp))
        Text("LENLU", color = Color.White, fontSize = 48.sp, fontWeight = FontWeight.Black); Text("COMMAND", color = G, fontSize = 48.sp, fontWeight = FontWeight.Black)
        Text("Tactical Cybernetic Command Deck.", color = Color(0xFF6B8C74), fontSize = 12.sp, modifier = Modifier.padding(top = 16.dp))
        Row(Modifier.padding(top = 32.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = { onNav(Screen.Build) }, colors = ButtonDefaults.buttonColors(containerColor = G, contentColor = Color.Black)) { Text("NEW PROJECT") }
            OutlinedButton(onClick = { onNav(Screen.Scan) }, border = BorderStroke(1.dp, G)) { Text("QUICK SCAN", color = G) }
        }
        Spacer(Modifier.height(40.dp))
        ForgeCard("System Architecture") {
            listOf("[+] DuckyPipeline v3", "[+] Neural Recon Link", "[+] AES-256 Vault").forEach { Text(it, color = Color(0xFF6B8C74), fontSize = 11.sp, modifier = Modifier.padding(vertical = 4.dp)) }
        }
    }
}

@Composable
fun DashView(b: Int, o: Int, s: Int, n: Int) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(1.dp)) { StatBox("Builds", b.toString(), Modifier.weight(1f)); StatBox("AI Ops", o.toString(), Modifier.weight(1f)) }
        Row(Modifier.fillMaxWidth().padding(top = 1.dp), horizontalArrangement = Arrangement.spacedBy(1.dp)) { StatBox("Scripts", s.toString(), Modifier.weight(1f)); StatBox("Scans", n.toString(), Modifier.weight(1f)) }
        Spacer(Modifier.height(16.dp))
        ForgeCard("Telemetry") { TelemetryWave() }
    }
}

@Composable
fun BuildView(onBuild: () -> Unit) {
    var src by remember { mutableStateOf("DELAY 500\nSTRING hello") }
    var out by remember { mutableStateOf("; Compiled code") }
    val logs = remember { mutableStateListOf<String>() }
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("EDITOR", color = Color.White, fontSize = 10.sp); Button(onClick = { onBuild(); logs.add("✓ Assembled"); out = src.split("\n").joinToString("\n") { "; $it" } }, colors = ButtonDefaults.buttonColors(containerColor = G, contentColor = Color.Black)) { Text("ASSEMBLE") }
        }
        TextField(value = src, onValueChange = { src = it }, modifier = Modifier.fillMaxWidth().height(200.dp).border(1.dp, GBORD), colors = TextFieldDefaults.colors(focusedContainerColor = Color.Black, unfocusedContainerColor = Color.Black, focusedTextColor = Color.White, unfocusedTextColor = Color.White))
        ForgeCard("Output") { Text(out, color = G_DIM, fontSize = 10.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.height(60.dp).verticalScroll(rememberScrollState())) }
        ConsoleLog(logs)
    }
}

@Composable
fun AIView(onOp: () -> Unit) {
    var chat by remember { mutableStateOf("") }
    val msgs = remember { mutableStateListOf(Pair("// Link Active.", false)) }
    val scope = rememberCoroutineScope()
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        ForgeCard("AI Synthesis", Modifier.weight(1f)) {
            Column {
                LazyColumn(Modifier.weight(1f)) { items(msgs) { (m, u) -> Text(if(u) "> $m" else m, color = if(u) CYAN else G, fontSize = 11.sp) } }
                Row {
                    TextField(value = chat, onValueChange = { chat = it }, modifier = Modifier.weight(1f))
                    IconButton(onClick = { if(chat.isBlank()) return@IconButton; msgs.add(Pair(chat, true)); val q = chat; chat = ""; onOp(); scope.launch { delay(800); msgs.add(Pair("// Result for $q optimized.", false)) } }, modifier = Modifier.background(G)) { Icon(Icons.Default.Send, "", tint = Color.Black) }
                }
            }
        }
    }
}

@Composable
fun ScanView(onScan: () -> Unit) {
    val logs = remember { mutableStateListOf<String>() }
    val scope = rememberCoroutineScope()
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ScanBtn(Icons.Default.Refresh, "BLE", Modifier.weight(1f)) { logs.add("Scanning BLE..."); scope.launch { delay(1000); logs.add("✓ Found nodes"); onScan() } }
            ScanBtn(Icons.Default.Wifi, "WIFI", Modifier.weight(1f)) { logs.add("WiFi Survey..."); scope.launch { delay(1000); logs.add("✓ Found nets"); onScan() } }
        }
        Spacer(Modifier.height(16.dp)); ForgeCard("Analysis", Modifier.weight(1f)) { ConsoleLog(logs) }
    }
}

@Composable
fun NetView() {
    var ip by remember { mutableStateOf("---") }
    val scope = rememberCoroutineScope()
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        ForgeCard("Network Info") {
            Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween) { Text("IP ADDR"); Text(ip, color = G) }
            Button(onClick = { ip = "SEARCHING..."; scope.launch { delay(1000); ip = "182.72.11.42" } }, modifier = Modifier.fillMaxWidth()) { Text("REFRESH") }
        }
    }
}

@Composable
fun VaultView(items: List<VaultItem>, onSave: (String, String) -> Unit, onDelete: (Int) -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Button(onClick = { onSave("NEW_PAYLOAD", "DATA") }, modifier = Modifier.fillMaxWidth()) { Text("STORE CURRENT") }
        Spacer(Modifier.height(16.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) { items(items.size) { i -> ForgeCard { Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween) { Text(items[i].name, color = G); IconButton(onClick = { onDelete(i) }) { Icon(Icons.Default.Delete, "", tint = RED) } } } } }
    }
}

@Composable
fun ConfigView(c: Boolean, onC: (Boolean) -> Unit, r: Boolean, onR: (Boolean) -> Unit, h: Boolean, onH: (Boolean) -> Unit, onWipe: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        ForgeCard { CfgRow("CRT Overlay", c, onC); CfgRow("Rain Background", r, onR); CfgRow("Haptic Feedback", h, onH) }
        Spacer(Modifier.height(40.dp)); Button(onClick = onWipe, colors = ButtonDefaults.buttonColors(containerColor = RED)) { Text("WIPE SYSTEM") }
    }
}

@Composable
fun ForgeCard(title: String = "", modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Surface(modifier = modifier.fillMaxWidth(), color = GLASS, border = BorderStroke(1.dp, GBORD), shape = RoundedCornerShape(6.dp)) {
        Column {
            if(title.isNotEmpty()) { Text(title.uppercase(), color = G, fontSize = 10.sp, modifier = Modifier.padding(8.dp)); HorizontalDivider(color = GBORD) }
            Column(modifier = Modifier.padding(12.dp)) { content() }
        }
    }
}

@Composable
fun StatBox(l: String, v: String, m: Modifier) {
    Surface(modifier = m, color = BASE1, border = BorderStroke(1.dp, GBORD)) { Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(v, color = G, fontSize = 22.sp, fontWeight = FontWeight.Black); Text(l.uppercase(), color = G_DIM, fontSize = 8.sp) } }
}

@Composable
fun ScanBtn(i: ImageVector, l: String, m: Modifier, onClick: () -> Unit) {
    OutlinedButton(onClick = onClick, modifier = m.height(70.dp), border = BorderStroke(1.dp, GBORD)) { Column(horizontalAlignment = Alignment.CenterHorizontally) { Icon(i, "", tint = Color.White); Text(l, color = Color.White, fontSize = 9.sp) } }
}

@Composable
fun CfgRow(l: String, v: Boolean, on: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(8.dp), Arrangement.SpaceBetween, Alignment.CenterVertically) { Text(l, color = Color.White); Switch(checked = v, onCheckedChange = on) }
}

@Composable
fun ConsoleLog(logs: List<String>) {
    LazyColumn(modifier = Modifier.fillMaxWidth().height(120.dp).background(Color.Black).border(1.dp, GBORD).padding(8.dp)) { items(logs.reversed()) { Text(it, color = CYAN, fontSize = 9.sp, fontFamily = FontFamily.Monospace) } }
}

@Composable
fun MatrixRain() {
    val chars = "ｱｲｳｴｵ12345".toCharArray()
    val drops = remember { IntArray(40) { (0..100).random() } }
    var tick by remember { mutableStateOf(0) }
    LaunchedEffect(Unit) { while(true) { delay(60); tick++; for(i in drops.indices) { drops[i]++; if(drops[i]>60 && Math.random()>0.97) drops[i]=0 } } }
    Canvas(Modifier.fillMaxSize()) { val w = size.width/40; for(i in drops.indices) { drawContext.canvas.nativeCanvas.drawText(chars[(chars.indices).random()].toString(), i*w, drops[i]*25f, android.graphics.Paint().apply { color=android.graphics.Color.argb(40,0,255,65); textSize=35f }) } }
}

@Composable
fun TelemetryWave() {
    var p by remember { mutableStateOf(0f) }
    LaunchedEffect(Unit) { while(true) { delay(30); p += 0.2f } }
    Canvas(Modifier.fillMaxWidth().height(60.dp)) { val path = Path(); for(i in 0..size.width.toInt() step 8) { val y = size.height/2 + sin(i*0.06f+p)*15f; if(i==0) path.moveTo(0f, y) else path.lineTo(i.toFloat(), y) }; drawPath(path, G, style=Stroke(2f)) }
}

@Composable
fun CRTOverlay() {
    Canvas(Modifier.fillMaxSize().alpha(0.06f)) { for(i in 0..size.height.toInt() step 6) { drawLine(Color.Black, Offset(0f, i.toFloat()), Offset(size.width, i.toFloat()), 3f) } }
}
