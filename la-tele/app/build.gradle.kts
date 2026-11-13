plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val ks = System.getenv("LATELE_KEYSTORE")

android {
    namespace = "es.latele.abuela"
    compileSdk = 34
    defaultConfig {
        applicationId = "es.latele.abuela"
        minSdk = 22
        targetSdk = 34
        versionCode = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionName = "1.0." + (System.getenv("GITHUB_RUN_NUMBER") ?: "0")
    }
    signingConfigs {
        if (ks != null && file(ks).exists()) {
            create("release") {
                storeFile = file(ks)
                storePassword = System.getenv("LATELE_KS_PASS")
                keyAlias = System.getenv("LATELE_KEY_ALIAS")
                keyPassword = System.getenv("LATELE_KEY_PASS")
            }
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
}

dependencies {
    val media3 = "1.4.1"
    implementation("androidx.media3:media3-exoplayer:$media3")
    implementation("androidx.media3:media3-exoplayer-hls:$media3")
    implementation("androidx.media3:media3-ui:$media3")
    implementation("androidx.annotation:annotation:1.8.2")
    implementation("androidx.annotation:annotation-experimental:1.4.1")
    testImplementation("junit:junit:4.13.2")
}
