// Global Variable
const NombreHoja = "VisualizacionTEST";[cite: 3]

// Simulación de TinyBD y HojaDeCálculo (Estructura base de App Inventor a JS)
let TinyBD1 = {
    User: "UsuarioEjemplo",
    Test: ["SLR", "ANKLE", "DJ", "CMJ", "SJ", "30-15", "PESO", "ALTURA"]
};

document.addEventListener("DOMContentLoaded", () => {
    Test_consulta_Initialize();

    document.getElementById("test").addEventListener("change", test_AfterPicking);
    document.getElementById("lateralidad").addEventListener("change", lateralidad_AfterPicking);
    document.getElementById("Enviar").addEventListener("click", Enviar_Click);
});

function Test_consulta_Initialize() {
    // Retrieves User from TinyBD1 and sets it to Nombre label[cite: 3]
    document.getElementById("Nombre").innerText = TinyBD1.User || "";[cite: 3]

    // Simula ReadRow en HojaDeCálculo1 con global NombreHoja y fila 1[cite: 3]
    console.log(`Leyendo fila 1 de la hoja: ${NombreHoja}`);

    // Llena el selector de test con los valores de TinyBD1[cite: 3]
    const testSelect = document.getElementById("test");
    testSelect.innerHTML = '<option value="">Seleccione un test...</option>';
    TinyBD1.Test.forEach(item => {
        let opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        testSelect.appendChild(opt);
    });
}

function test_AfterPicking() {
    const testVal = document.getElementById("test").value;
    const lateralidadGroup = document.getElementById("group-lateralidad");
    const lateralidadSelect = document.getElementById("lateralidad");

    document.getElementById("Resultado").innerText = testVal;[cite: 3]

    // Si la selección es "SLR", "ANKLE", o "DJ", habilita lateralidad; de lo contrario, limpia y desactiva[cite: 3]
    if (["SLR", "ANKLE", "DJ"].includes(testVal)) {
        lateralidadGroup.style.display = "block";
        lateralidadSelect.disabled = false;[cite: 3]
    } else {
        lateralidadGroup.style.display = "none";
        lateralidadSelect.value = "";[cite: 3]
        lateralidadSelect.disabled = true;[cite: 3]
    }
}

function lateralidad_AfterPicking() {
    const testVal = document.getElementById("test").value;
    const latVal = document.getElementById("lateralidad").value;
    
    // Combina test y lateralidad para actualizar el Resultado[cite: 3]
    document.getElementById("Resultado").innerText = testVal + latVal;[cite: 3]
}

function Enviar_Click() {
    const testVal = document.getElementById("test").value;
    const latVal = document.getElementById("lateralidad").value;
    const testElement = document.getElementById("test");

    // Valida si el campo test está vacío[cite: 3]
    if (!testVal) {
        testElement.style.backgroundColor = "#ffcccc";[cite: 3]
        alert("El campo de test es obligatorio.");[cite: 3]
        return;
    } else {
        testElement.style.backgroundColor = "";
    }

    const resultadoFinal = document.getElementById("Resultado").innerText;

    // Simula ReadWithExactFilter en HojaDeCálculo1[cite: 3]
    console.log(`Filtrando hoja ${NombreHoja}, fila 1, con nombre: ${document.getElementById("Nombre").innerText}`);
    
    // Simulación de respuesta de la base de datos (HojaDeCálculo1 GotFilterResult)
    simularGotFilterResult(resultadoFinal, [
        ["DatoA", "DatoB", "DatoC", "DatoD"]
    ]);
}

function HojaDeCálculo1_GotFilterResult(resultado, returnData) {
    // Verifica si returnData no está vacío[cite: 3]
    if (!returnData || returnData.length === 0) return;

    let row = returnData[0]; // Extrae los elementos de la lista anidada

    // Comprobaciones condicionales basadas en los códigos de test[cite: 3]
    if (["SLRIZQ", "SLRDCH", "CMJ", "SJ", "30-15", "PESO", "ALTURA"].includes(resultado)) {
        document.getElementById("CampoDeTexto1").value = row[0] || "";[cite: 3]
        document.getElementById("CampoDeTexto2").value = row[1] || "";[cite: 3]
        document.getElementById("CampoDeTexto3").value = row[2] || "";[cite: 3]
        document.getElementById("CampoDeTexto4").value = row[3] || "";[cite: 3]
    }
}

// Función auxiliar para simular el evento de la API/Hoja de Cálculo
function simularGotFilterResult(resultado, returnData) {
    HojaDeCálculo1_GotFilterResult(resultado, returnData);
}
