const NombreHoja = "VisualizacionTEST";[cite: 3]

document.addEventListener("DOMContentLoaded", () => {
    Test_consulta_Initialize();

    document.getElementById("test").addEventListener("change", test_AfterPicking);
    document.getElementById("lateralidad").addEventListener("change", lateralidad_AfterPicking);
    document.getElementById("Enviar").addEventListener("click", Enviar_Click);
});

function Test_consulta_Initialize() {
    const user = localStorage.getItem("User") || sessionStorage.getItem("User") || "UsuarioDemo";[cite: 3]
    document.getElementById("Nombre").innerText = user;[cite: 3]

    console.log(`Leyendo fila 1 de la hoja: ${NombreHoja}`);[cite: 3]

    const testList = ["SLR", "ANKLE", "DJ", "CMJ", "SJ", "30-15", "PESO", "ALTURA"];[cite: 3]
    const testSelect = document.getElementById("test");
    
    testSelect.innerHTML = '<option value="">Seleccione...</option>';
    testList.forEach(item => {
        let opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        testSelect.appendChild(opt);[cite: 3]
    });
}

function actualizarResultado() {
    const testVal = document.getElementById("test").value;
    const latVal = document.getElementById("lateralidad").value;
    document.getElementById("Resultado").innerText = testVal + latVal;[cite: 3]
}

function test_AfterPicking() {
    const testVal = document.getElementById("test").value;
    const lateralidadSelect = document.getElementById("lateralidad");

    if (["SLR", "ANKLE", "DJ"].includes(testVal)) {
        lateralidadSelect.disabled = false;[cite: 3]
    } else {
        lateralidadSelect.value = "";[cite: 3]
        lateralidadSelect.disabled = true;[cite: 3]
    }
    actualizarResultado();
}

function lateralidad_AfterPicking() {
    actualizarResultado();[cite: 3]
}

function Enviar_Click() {
    const testElement = document.getElementById("test");
    const testVal = testElement.value;

    if (!testVal) {
        testElement.style.backgroundColor = "#ffcccc";[cite: 3]
        alert("El campo de test es obligatorio.");[cite: 3]
        return;
    } else {
        testElement.style.backgroundColor = "";
    }

    const resultadoFinal = document.getElementById("Resultado").innerText;
    console.log(`Filtrando hoja ${NombreHoja}, fila 1, con nombre: ${document.getElementById("Nombre").innerText}`);[cite: 3]

    simularGotFilterResult(resultadoFinal, [
        ["120", "2026-06-01", "135", "2026-06-10"]
    ]);
}

function HojaDeCálculo1_GotFilterResult(resultado, returnData) {
    if (!returnData || returnData.length === 0) return;[cite: 3]

    let row = returnData[0];[cite: 3]

    if (["SLRIZQ", "SLRDCH", "CMJ", "SJ", "30-15", "PESO", "ALTURA", "SLR", "ANKLE", "DJ"].includes(resultado)) {
        document.getElementById("CampoDeTexto1").value = row[0] || "";[cite: 3]
        document.getElementById("CampoDeTexto2").value = row[1] || "";[cite: 3]
        document.getElementById("CampoDeTexto3").value = row[2] || "";[cite: 3]
        document.getElementById("CampoDeTexto4").value = row[3] || "";[cite: 3]
    }
}

function simularGotFilterResult(resultado, returnData) {
    HojaDeCálculo1_GotFilterResult(resultado, returnData);
}
