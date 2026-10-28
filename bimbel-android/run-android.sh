
#!/usr/bin/env bash
set -euo pipefail

SDK="${ANDROID_HOME:-$HOME/Android/Sdk}"
EMULATOR="$SDK/emulator/emulator"
ADB="$SDK/platform-tools/adb"

# Ganti sesuai nama yang muncul dari emulator -list-avds
AVD="Medium_Phone"

if [[ ! -x "$EMULATOR" || ! -x "$ADB" ]]; then
    echo "Android SDK emulator atau ADB tidak ditemukan."
    echo "Periksa lokasi SDK: $SDK"
    exit 1
fi

# Pastikan ADB aktif
"$ADB" start-server

# Gunakan emulator yang sudah berjalan jika tersedia
DEVICE=$("$ADB" devices | awk '$1 ~ /^emulator-[0-9]+$/ && $2 == "device" {print $1; exit}')

# Jika belum ada, nyalakan emulator tanpa membuka Android Studio
if [[ -z "$DEVICE" ]]; then
    echo "Menyalakan emulator: $AVD"
    "$EMULATOR" -avd "$AVD" -no-boot-anim >/tmp/flutter-emulator.log 2>&1 &
fi

# Tunggu emulator terdeteksi dan selesai boot
DEVICE=""
for i in $(seq 1 120); do
    DEVICE=$("$ADB" devices | awk '$1 ~ /^emulator-[0-9]+$/ && $2 == "device" {print $1; exit}')

    if [[ -n "$DEVICE" ]] &&
       [[ "$("$ADB" -s "$DEVICE" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; then
        break
    fi

    DEVICE=""
    sleep 2
done

if [[ -z "$DEVICE" ]]; then
    echo "Emulator belum siap setelah 240 detik."
    echo "Periksa log: /tmp/flutter-emulator.log"
    exit 1
fi

echo "Emulator siap: $DEVICE"

cd "$(dirname "$0")"
flutter pub get
flutter run -d "$DEVICE"
