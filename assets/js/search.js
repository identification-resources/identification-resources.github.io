(async function () {
    const inputField = document.getElementById('catalog_select')
    const [headers] = await loadCatalog()

    for (const header of headers) {
        const selectOption = document.createElement('option')
        selectOption.textContent = fieldLabels[header]
        selectOption.setAttribute('value', header)
        inputField.appendChild(selectOption)
    }
})()
