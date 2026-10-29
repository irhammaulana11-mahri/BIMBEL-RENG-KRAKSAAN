import java.io.FileInputStream
import java.util.Base64
import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Kunci rilis (MOB-02): android/key.properties (di-ignore git), berisi storeFile, storePassword,
// keyAlias, keyPassword. Lihat DEPLOY.md bagian Android.
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "id.bimbelreng.bimbel_reng"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "id.bimbelreng.bimbel_reng"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            // Tidak pernah memakai kunci debug untuk rilis; tanpa key.properties build rilis dihentikan di bawah
            signingConfig = signingConfigs.findByName("release")
        }
    }
}

// Pengaman build rilis: kunci rilis harus ada dan API_URL harus https (MOB-01, MOB-02)
gradle.taskGraph.whenReady {
    if (allTasks.none { it.name.contains("Release") }) return@whenReady

    if (!keystorePropertiesFile.exists()) {
        throw GradleException("Build rilis butuh android/key.properties (kunci rilis). Lihat DEPLOY.md bagian Android.")
    }
    val dartDefines = (project.findProperty("dart-defines") as String?).orEmpty()
        .split(",").filter { it.isNotBlank() }
        .map { String(Base64.getDecoder().decode(it)) }
    val apiUrl = dartDefines.firstOrNull { it.startsWith("API_URL=") }?.removePrefix("API_URL=")
    if (apiUrl == null || !apiUrl.startsWith("https://")) {
        throw GradleException("Build rilis butuh --dart-define=API_URL=https://... (sekarang: ${apiUrl ?: "kosong"}).")
    }
}

flutter {
    source = "../.."
}
