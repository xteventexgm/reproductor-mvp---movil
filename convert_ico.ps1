Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\Dell\Desktop\steven\reproductor-mvp - movil\build\icon.png")
$img.Save("C:\Users\Dell\Desktop\steven\reproductor-mvp - movil\build\icon.ico", [System.Drawing.Imaging.ImageFormat]::Icon)
$img.Dispose()
