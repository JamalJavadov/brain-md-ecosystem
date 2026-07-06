import AppKit

let outputPath = CommandLine.arguments[1]
let size = NSSize(width: 1024, height: 1024)
let image = NSImage(size: size)

image.lockFocus()

let background = NSBezierPath(
    roundedRect: NSRect(x: 64, y: 64, width: 896, height: 896),
    xRadius: 190,
    yRadius: 190
)
NSColor(calibratedRed: 0.06, green: 0.46, blue: 0.43, alpha: 1).setFill()
background.fill()

let shadow = NSShadow()
shadow.shadowColor = NSColor.black.withAlphaComponent(0.18)
shadow.shadowBlurRadius = 32
shadow.shadowOffset = NSSize(width: 0, height: -16)
NSGraphicsContext.current?.saveGraphicsState()
shadow.set()

let tab = NSBezierPath(
    roundedRect: NSRect(x: 205, y: 592, width: 330, height: 150),
    xRadius: 44,
    yRadius: 44
)
NSColor(calibratedRed: 1.0, green: 0.85, blue: 0.44, alpha: 1).setFill()
tab.fill()

let folder = NSBezierPath(
    roundedRect: NSRect(x: 160, y: 250, width: 704, height: 430),
    xRadius: 58,
    yRadius: 58
)
NSColor(calibratedRed: 0.97, green: 0.78, blue: 0.28, alpha: 1).setFill()
folder.fill()
NSGraphicsContext.current?.restoreGraphicsState()

let sheet = NSBezierPath(
    roundedRect: NSRect(x: 330, y: 318, width: 364, height: 270),
    xRadius: 32,
    yRadius: 32
)
NSColor.white.withAlphaComponent(0.96).setFill()
sheet.fill()

NSColor(calibratedRed: 0.06, green: 0.46, blue: 0.43, alpha: 1).setStroke()
for y in [510.0, 444.0, 378.0] {
    let line = NSBezierPath()
    line.lineWidth = 20
    line.lineCapStyle = .round
    line.move(to: NSPoint(x: 395, y: y))
    line.line(to: NSPoint(x: y == 378 ? 575 : 630, y: y))
    line.stroke()
}

image.unlockFocus()

guard let tiff = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let png = bitmap.representation(using: .png, properties: [:]) else {
    fatalError("Could not generate app icon")
}

try png.write(to: URL(fileURLWithPath: outputPath))
