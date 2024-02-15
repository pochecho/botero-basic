async function init() {
  const map = {
    png: 'data:image/png;base64,',
    jpg: 'data:image/jpg;base64,',
    jpeg: 'data:image/jpg;base64,',
  };
  imagen = document.getElementById('imagen');
  imagen.addEventListener('change', async function (event) {
    console.log(event.target.files[0]);
    img = document.getElementById('preview');
    const file = event.target.files[0];
    if (file) {
      const extension = event.target.value.split('.').pop();
      const prefix = map[extension] || map['jpg'];
      const r = await convertirABase64(event.target.files[0]);
      img.src = `${prefix}${r}`;
    }
  });
}

async function convertirABase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); // Extrae la parte Base64
    reader.onerror = (error) => reject(error);
  });
}
