function doPost(e) {

  try {

    Logger.log("=================================");
    Logger.log("📥 DOPOST RECIBIDO");
    Logger.log("=================================");

    if (!e) {
      Logger.log("❌ El objeto e es undefined");
      throw new Error("No se recibió el objeto e");
    }

    if (!e.parameter) {
      Logger.log("❌ e.parameter es undefined");
      throw new Error("No se recibieron parámetros");
    }

    Logger.log("📋 Parámetros recibidos:");
    Logger.log(JSON.stringify(e.parameter));

    var dataBase64 = e.parameter.data;
    var mimetype = e.parameter.mimetype;
    var filename = e.parameter.filename;
    var folderId = e.parameter.folderId;

    Logger.log("📄 Filename: " + filename);
    Logger.log("🖼️ Mimetype: " + mimetype);
    Logger.log("📁 Folder ID: " + folderId);

    if (!dataBase64) {
      throw new Error("No se recibió la imagen (data)");
    }

    if (!folderId) {
      throw new Error("No se recibió folderId");
    }

    if (!filename) {
      throw new Error("No se recibió filename");
    }

    Logger.log("📦 Longitud Base64: " + dataBase64.length);

    // Convertir Base64 a bytes
    var data = Utilities.base64Decode(dataBase64);

    Logger.log("🔄 Base64 convertido correctamente");
    Logger.log("📦 Bytes: " + data.length);

    // Crear Blob
    var blob = Utilities.newBlob(
      data,
      mimetype || "image/jpeg",
      filename
    );

    Logger.log("🧱 Blob creado");

    // Buscar carpeta
    var folder = DriveApp.getFolderById(folderId);

    Logger.log("📁 Carpeta encontrada: " + folder.getName());

    // Crear archivo
    var file = folder.createFile(blob);

    Logger.log("✅ ARCHIVO CREADO");
    Logger.log("📄 Nombre: " + file.getName());
    Logger.log("🆔 ID: " + file.getId());

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: true,
          fileId: file.getId()
        })
      )
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {

    Logger.log("=================================");
    Logger.log("❌ ERROR");
    Logger.log(error.message);
    Logger.log(error.stack);
    Logger.log("=================================");

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: false,
          error: error.message
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }
}
