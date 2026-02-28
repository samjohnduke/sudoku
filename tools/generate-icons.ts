import sharp from "sharp";

async function main() {
  const sizes = [
    { name: "public/icon-192.png", size: 192 },
    { name: "public/icon-512.png", size: 512 },
    { name: "public/apple-touch-icon.png", size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp("public/icon.svg")
      .resize(size, size)
      .png()
      .toFile(name);
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

main().catch(console.error);
