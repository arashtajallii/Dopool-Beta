import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const androidBuildGradle = path.join(androidDir, 'build.gradle');

function run(cmd, ignoreError = false) {
  try {
    console.log(`\n▶ اجرای دستور: ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd: rootDir });
    return true;
  } catch (err) {
    if (!ignoreError) {
      throw err;
    }
    return false;
  }
}

console.log('====================================================');
console.log('🚀 آماده‌سازی نسخه انتشار دوپول (Dopool) برای Android Studio');
console.log('====================================================');

// 1. Ensure Capacitor packages are installed
if (!existsSync(path.join(rootDir, 'node_modules', '@capacitor', 'android'))) {
  run('npm install @capacitor/core @capacitor/cli @capacitor/android --legacy-peer-deps');
}

// 2. Build production web bundle
run('npm run build');

// 3. Add or rebuild Android platform safely (works on Windows, macOS, Linux)
if (!existsSync(androidBuildGradle)) {
  if (existsSync(androidDir)) {
    rmSync(androidDir, { recursive: true, force: true });
  }
  run('npx cap add android');
}

// 4. Sync dist/ assets into android/app/src/main/assets/public
run('npx cap sync android');

console.log('\n✅ پوشه نیتیو android با موفقیت ساخته و همگام‌سازی شد!');
console.log(`📂 مسیر پروژه اندروید: ${androidDir}`);

// 5. Try to launch Android Studio if installed in default path, without failing if custom path
const opened = run('npx cap open android', true);
if (!opened) {
  console.log('\n💡 نکته برای ویندوز: برنامه Android Studio را باز کنید، گزینه File -> Open را بزنید و پوشه زیر را انتخاب نمایید:');
  console.log(`   ${androidDir}`);
}
