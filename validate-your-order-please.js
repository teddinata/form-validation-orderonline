
  // OrderOnline Form Validator - Script Lengkap
  // Ganti YOUR_FONNTE_API_KEY dengan API key Fonnte Anda
  function getUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const getParamInsensitive = (key) => {
      key = key.toLowerCase();
      for (const [k, v] of params.entries()) {
        if (k.toLowerCase() === key) {
          return v;
        }
      }
      return null;
    };

    return {
      formId: getParamInsensitive('form') || null,
      productId: getParamInsensitive('sub') || null,
      campaignId: getParamInsensitive('CampaignID') || getParamInsensitive('campaign_id') || null,
      adsetId: getParamInsensitive('adSETID') || getParamInsensitive('ad_set_id') || null,
      adsId: getParamInsensitive('CreativeID') || getParamInsensitive('adsId') || getParamInsensitive('ads_id') || null,
      clickId: getParamInsensitive('click_id') || null,
      pixelId: getParamInsensitive('pixel_id') || null
    };
  }
  
  window.onload = function() {
    const timeoutLimit = 15000;
    let timeoutId;

    const initialForm = document.querySelectorAll('.orderonline-embed-form');
    if (initialForm.length > 0 && initialForm[0].querySelectorAll('input').length > 0) {
      setupValidation(initialForm);
      return;
    }
  
    const observer = new MutationObserver(() => {
      const forms = document.querySelectorAll('.orderonline-embed-form');
      if (forms.length > 0) {
        clearTimeout(timeoutId);
        observer.disconnect();
        setupValidation(forms);
      }
    });
  
    // Start observing changes in the DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  
    // Fallback timeout if form doesn't appear in time
    timeoutId = setTimeout(() => {
      observer.disconnect();
      console.error('Form OrderOnline tidak ditemukan dalam 15 detik');
    }, timeoutLimit);
  }
  
  // Fungsi untuk mengirim data ke API
  async function submitToAPI(formData) {
    try {
      const apiEndpoint = 'https://pnglabs.my.id/api/form/input';
      
      console.log('Mengirim data ke API:', formData);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      return result;
    } catch (error) {
      console.error('Error submitting form data to API:', error);
      throw error;
    }
  }
  
  // Fungsi untuk menampilkan status pengiriman ke API
  function showAPIStatus(form, status, message) {
    // Hapus notifikasi yang sudah ada (jika ada)
    const existingNotif = form.querySelector('.api-status-notification');
    if (existingNotif) {
      existingNotif.remove();
    }
    
    // Buat notifikasi baru
    const notification = document.createElement('div');
    notification.className = 'api-status-notification';
    notification.style.padding = '10px';
    notification.style.marginBottom = '15px';
    notification.style.borderRadius = '4px';
    notification.style.fontSize = '14px';
    
    if (status === 'loading') {
      notification.style.backgroundColor = '#e2f3fd';
      notification.style.color = '#0c5460';
      notification.textContent = 'Mengirim data...';
    } else if (status === 'success') {
      notification.style.backgroundColor = '#d4edda';
      notification.style.color = '#155724';
      notification.textContent = message || 'Data berhasil disimpan!';
    } else if (status === 'error') {
      notification.style.backgroundColor = '#f8d7da';
      notification.style.color = '#721c24';
      notification.textContent = message || 'Gagal menyimpan data. Silakan coba lagi.';
    }
    
    // Tambahkan notifikasi ke form
    form.insertBefore(notification, form.firstChild);
    
    // Hapus notifikasi setelah beberapa detik (kecuali jika error)
    if (status !== 'error') {
      setTimeout(() => {
        notification.remove();
      }, 5000);
    }
  }
  
  function setupValidation(forms) {
    forms.forEach(form => {
      // Cek apakah form sudah di-setup sebelumnya
      if (form.hasAttribute('data-validation-initialized')) {
        return; // Lewati jika sudah di-setup
      }
      
      // Tandai form ini sudah di-setup
      form.setAttribute('data-validation-initialized', 'true');
      
      // Mencari input fields dalam form
      const nameInputs = form.querySelectorAll('input[name*="name"], input[placeholder*="nama"], input[placeholder*="Name"]');
      const phoneInputs = form.querySelectorAll('input[name*="phone"], input[name*="telp"], input[placeholder*="telepon"], input[placeholder*="hp"], input[placeholder*="HP"]');
      const addressInputs = form.querySelectorAll('textarea[name*="address"], textarea[placeholder*="alamat"], textarea[placeholder*="Address"]');
      
      // Mencari tombol submit
      const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
      
      // Tambahkan label error untuk setiap field
      addValidationUI(nameInputs, 'name-error');
      addValidationUI(phoneInputs, 'phone-error');
      addValidationUI(addressInputs, 'address-error');
      
      // Tambahkan event listener ke tombol submit
      submitButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          // Cegah form submit jika tidak valid
          if (!validateForm(form)) {
            e.preventDefault();
            e.stopPropagation();
          } else {
            // Form valid, simpan timestamp di localStorage
            saveSubmissionTimestamp();
          }
        });
      });
      
      // Tambahkan validasi realtime pada input
      if (nameInputs.length > 0) {
        nameInputs.forEach(input => {
          input.addEventListener('input', function() {
            validateName(input);
          });
        });
      }
      
      // Setup validasi WhatsApp dan tombol disable
      setupWhatsAppValidation(forms);
      
      if (addressInputs.length > 0) {
        addressInputs.forEach(input => {
          input.addEventListener('input', function() {
            validateAddress(input);
          });
        });
      }
      
      // Tambahkan panduan alamat
      addAddressGuidance();
      
      // Cek apakah user sudah submit dalam 3 hari terakhir
      checkPreviousSubmission();
    });
  }
  
  function addValidationUI(inputs, errorClass) {
    inputs.forEach(input => {
      // Tambahkan style ke input
      input.style.transition = 'border-color 0.3s';
      
      // Buat error label
      const errorLabel = document.createElement('div');
      errorLabel.className = errorClass;
      errorLabel.style.color = '#ff0000';
      errorLabel.style.fontSize = '12px';
      errorLabel.style.marginTop = '4px';
      errorLabel.style.display = 'none';
      
      // Masukkan error label setelah input
      input.parentNode.insertBefore(errorLabel, input.nextSibling);
    });
  }
  
  function validateForm(form) {
    // Cek apakah form sudah disubmit dalam 3 hari terakhir
    if (isRecentlySubmitted()) {
      alert('Anda sudah mengisi form ini dalam 3 hari terakhir. Silakan coba lagi nanti.');
      return false;
    }
    
    // Cek apakah user sudah di-block karena spam
    if (isBlocked()) {
      alert('Maaf, akses Anda ke form ini telah dibatasi. Silakan hubungi admin.');
      return false;
    }
    
    // Validasi semua field
    let isValid = true;
    
    // Kumpulkan data untuk API
    let nama = '';
    let nomor_hp = '';
    let alamat = '';
    
    // Validasi nama
    const nameInputs = form.querySelectorAll('input[name*="name"], input[placeholder*="nama"], input[placeholder*="Name"]');
    nameInputs.forEach(input => {
      if (!validateName(input)) {
        isValid = false;
      } else {
        nama = input.value.trim();
      }
    });
    
    // Validasi phone
    const phoneInputs = form.querySelectorAll('input[name*="phone"], input[name*="telp"], input[placeholder*="telepon"], input[placeholder*="hp"], input[placeholder*="HP"]');
    phoneInputs.forEach(input => {
      if (!validatePhoneBasic(input)) {
        isValid = false;
      } else {
        nomor_hp = input.value.trim();
      }
    });
    
    // Validasi alamat
    const addressInputs = form.querySelectorAll('textarea[name*="address"], textarea[placeholder*="alamat"], textarea[placeholder*="Address"]');
    addressInputs.forEach(input => {
      if (!validateAddress(input)) {
        isValid = false;
      } else {
        alamat = input.value.trim();
      }
    });
    
    // Jika form valid, proses dan kirim data ke API
    if (isValid) {
      // Dapatkan parameter dari URL
      const urlParams = getUrlParameters();
      
      // Dapatkan product info dari form attributes atau URL
      const productName = form.getAttribute('data-product-slug') || '';
      const productId = form.getAttribute('data-product-id') || urlParams.productId || '';
      const formId = form.getAttribute('id') || urlParams.formId || '';
      
      // Persiapkan data untuk API
      const apiData = {
        "nama": nama,
        "nomor_hp": nomor_hp,
        "alamat": alamat, 
        "formId": formId,
        "product": productName && productId ? `${productName}${productId}` : null,
        "campaignId": urlParams.campaignId || null,
        "adsetId": urlParams.adsetId || null,
        "adsId": urlParams.adsId || null
      };
      
      // Tampilkan status loading
      showAPIStatus(form, 'loading');
      
      // Kirim data ke API
      submitToAPI(apiData)
        .then(result => {
          console.log('Data berhasil disimpan ke API:', result);
          showAPIStatus(form, 'success', 'Data berhasil disimpan!');
        })
        .catch(error => {
          console.error('Gagal menyimpan data ke API:', error);
          showAPIStatus(form, 'error', 'Gagal menyimpan data: ' + error.message);
        });
    }
    
    return isValid;
  }
  
  function validateName(input) {
    const value = input.value.trim();
    const errorLabel = input.nextElementSibling;
    
    // Reset UI
    input.style.borderColor = '';
    if (errorLabel && errorLabel.className === 'name-error') {
      errorLabel.style.display = 'none';
    }
    
    // Validasi: tidak boleh kosong
    if (!value) {
      showError(input, errorLabel, 'Nama tidak boleh kosong');
      return false;
    }
    
    // Validasi: minimal 3 karakter
    if (value.length < 3) {
      showError(input, errorLabel, 'Nama minimal 3 karakter');
      return false;
    }
    
    // Validasi: tidak boleh mengandung angka
    if (/\d/.test(value)) {
      showError(input, errorLabel, 'Nama tidak boleh mengandung angka');
      return false;
    }
    
    // Validasi: karakter tidak boleh berulang 3 kali atau lebih
    if (/(.)\1{2,}/.test(value)) {
      showError(input, errorLabel, 'Nama tidak boleh mengandung karakter yang berulang 3 kali atau lebih');
      return false;
    }
    
    // Validasi: tidak boleh 3 huruf konsonan berturut-turut
    const words = value.split(/\s+/);
    
    for (let word of words) {
      // Ubah ke lowercase untuk mempermudah
      const wordLower = word.toLowerCase();
      
      // Cek apakah ada 3 konsonan berurutan
      let hasThreeConsecutiveConsonants = false;
      let consonantCount = 0;
      
      for (let i = 0; i < wordLower.length; i++) {
        const char = wordLower[i];
        // Cek apakah huruf konsonan
        if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
          consonantCount++;
          if (consonantCount >= 3) {
            hasThreeConsecutiveConsonants = true;
            break;
          }
        } else if ('aeiou'.includes(char)) {
          // Reset counter jika vokal
          consonantCount = 0;
        }
      }
      
      if (hasThreeConsecutiveConsonants) {
        showError(input, errorLabel, 'Nama tidak boleh mengandung 3 huruf konsonan berturut-turut');
        return false;
      }
    }
    
    return true;
  }
  
  // Validasi dasar nomor telepon tanpa cek WhatsApp
  function validatePhoneBasic(input) {
    const value = input.value.trim();
    const errorLabel = input.nextElementSibling;
    
    // Reset UI
    input.style.borderColor = '';
    if (errorLabel && errorLabel.className === 'phone-error') {
      errorLabel.style.display = 'none';
    }
    
    // Validasi: tidak boleh kosong
    if (!value) {
      showError(input, errorLabel, 'Nomor HP tidak boleh kosong');
      return false;
    }
    
    // Validasi: hanya boleh angka
    if (!/^\d+$/.test(value)) {
      showError(input, errorLabel, 'Nomor HP hanya boleh berisi angka');
      return false;
    }
    
    // Validasi: panjang minimal 9 karakter
    if (value.length < 9) {
      showError(input, errorLabel, 'Nomor HP minimal 9 digit');
      return false;
    }
    
    // Validasi: format Indonesia (opsional)
    if (!/^(08|\+628|628)/.test(value)) {
      showError(input, errorLabel, 'Format nomor HP Indonesia yang benar: 08xx, +628xx, atau 628xx');
      return false;
    }
    
    return true;
  }
  
  function validateAddress(input) {
    const value = input.value.trim();
    const errorLabel = input.nextElementSibling;
    
    // Reset UI
    input.style.borderColor = '';
    if (errorLabel && errorLabel.className === 'address-error') {
      errorLabel.style.display = 'none';
    }
    
    // Validasi: tidak boleh kosong
    if (!value) {
      showError(input, errorLabel, 'Alamat tidak boleh kosong');
      return false;
    }
    
    // Validasi: minimal 25 karakter
    if (value.length < 25) {
      showError(input, errorLabel, 'Alamat minimal 25 karakter');
      return false;
    }
    
    // Jika lolos semua validasi
    return true;
  }
  
  function showError(input, errorLabel, message) {
    input.style.borderColor = '#ff0000';
    if (errorLabel) {
      errorLabel.textContent = message;
      errorLabel.style.display = 'block';
    } else {
      console.error('Error label not found for', input);
    }
  }
  
  // Fungsi untuk menambahkan panduan format alamat dengan perbaikan
  function addAddressGuidance() {
    const forms = document.querySelectorAll('.orderonline-embed-form');
    forms.forEach(form => {
      // Cek apakah form sudah ditambahkan panduan alamat
      if (form.hasAttribute('data-address-guidance-added')) {
        return; // Lewati jika sudah ditambahkan sebelumnya
      }
      
      // Tandai form ini sudah ditambahkan panduan
      form.setAttribute('data-address-guidance-added', 'true');
      
      const addressInputs = form.querySelectorAll('textarea[name*="address"], textarea[placeholder*="alamat"], textarea[placeholder*="Address"]');
      
      addressInputs.forEach(input => {
        // Cek apakah input sudah ditambahkan panduan
        if (input.hasAttribute('data-guidance-added')) {
          return; // Lewati jika sudah ditambahkan sebelumnya
        }
        
        // Tandai input ini sudah ditambahkan panduan
        input.setAttribute('data-guidance-added', 'true');
        
        // Buat elemen bantuan
        const helpText = document.createElement('div');
        helpText.style.fontSize = '12px';
        helpText.style.color = '#666';
        helpText.style.marginTop = '4px';
        helpText.innerHTML = 'Masukkan alamat lengkap minimal 25 karakter';
        
        // Tambahkan sebelum input
        input.parentNode.insertBefore(helpText, input);
        
        // Update placeholder jika ada dan belum dimodifikasi
        if (input.placeholder && !input.placeholder.includes('(min. 25 karakter)')) {
          input.placeholder += ' (min. 25 karakter)';
        }
      });
    });
  }
  
  // Fungsi untuk setup validasi WhatsApp
  function setupWhatsAppValidation(forms) {
    forms.forEach(form => {
      const phoneInputs = form.querySelectorAll('input[name*="phone"], input[name*="telp"], input[placeholder*="telepon"], input[placeholder*="hp"], input[placeholder*="HP"]');
      
      if (phoneInputs.length > 0) {
        phoneInputs.forEach(input => {
          // Tambahkan event listener untuk validasi realtime
          input.addEventListener('blur', function() {
            validateWhatsAppAndToggleButton(input);
          });
          
          // Nonaktifkan tombol submit saat awal
          const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
          submitButtons.forEach(button => {
            button.disabled = true;
            button.style.opacity = '0.7';
            button.style.cursor = 'not-allowed';
            
            // Tambahkan teks tambahan jika tidak ada nomor yang dimasukkan
            if (!input.value.trim()) {
              button.setAttribute('data-original-text', button.innerHTML);
              button.setAttribute('title', 'Masukkan nomor WhatsApp yang valid terlebih dahulu');
            }
          });
        });
      }
    });
  }
  
  // Fungsi untuk validasi nomor WhatsApp dan menonaktifkan tombol jika tidak valid
  async function validateWhatsAppAndToggleButton(phoneInput) {
    const value = phoneInput.value.trim();
    const errorLabel = phoneInput.nextElementSibling;
    const form = phoneInput.closest('.orderonline-embed-form');
    
    // Temukan tombol submit
    const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
    
    // Reset UI
    phoneInput.style.borderColor = '';
    if (errorLabel && errorLabel.className === 'phone-error') {
      errorLabel.style.display = 'none';
    }
    
    // Nonaktifkan tombol terlebih dahulu dan tambahkan teks "Memeriksa..."
    submitButtons.forEach(button => {
      const originalText = button.getAttribute('data-original-text') || button.innerHTML;
      button.setAttribute('data-original-text', originalText);
      button.innerHTML = 'Memeriksa...';
      button.disabled = true;
      button.style.opacity = '0.7';
      button.style.cursor = 'not-allowed';
    });
    
    // Validasi dasar
    let isValid = true;
    
    // Validasi: tidak boleh kosong
    if (!value) {
      showError(phoneInput, errorLabel, 'Nomor HP tidak boleh kosong');
      isValid = false;
    }
    // Validasi: hanya boleh angka
    else if (!/^\d+$/.test(value)) {
      showError(phoneInput, errorLabel, 'Nomor HP hanya boleh berisi angka');
      isValid = false;
    }
    // Validasi: panjang minimal 9 karakter
    else if (value.length < 9) {
      showError(phoneInput, errorLabel, 'Nomor HP minimal 9 digit');
      isValid = false;
    }
    // Validasi: format Indonesia
    else if (!/^(08|\+628|628)/.test(value)) {
      showError(phoneInput, errorLabel, 'Format nomor HP Indonesia yang benar: 08xx, +628xx, atau 628xx');
      isValid = false;
    }
    
    // Jika validasi dasar gagal, kembalikan tombol ke keadaan normal namun tetap disabled
    if (!isValid) {
      submitButtons.forEach(button => {
        const originalText = button.getAttribute('data-original-text');
        button.innerHTML = originalText;
        button.disabled = true;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
      });
      return false;
    }
    
    // Jika validasi dasar berhasil, lakukan cek WhatsApp
    try {
      // Tambahkan loading state
      phoneInput.style.borderColor = '#ffc107';
      if (errorLabel) {
        errorLabel.textContent = 'Memeriksa nomor WhatsApp...';
        errorLabel.style.color = '#ffc107';
        errorLabel.style.display = 'block';
      }
      
      // Jalankan pengecekan WhatsApp
      const isWhatsApp = await checkWhatsAppNumber(value);

      const isWhatsAppRegistered = await checkWhatsAppNumberRegistered(value);
      
      if (!isWhatsApp) {
        showError(phoneInput, errorLabel, 'Nomor tidak terdaftar di WhatsApp');
        
        // Kembalikan tombol ke keadaan normal namun tetap disabled
        submitButtons.forEach(button => {
          const originalText = button.getAttribute('data-original-text');
          button.innerHTML = originalText;
          button.disabled = true;
          button.style.opacity = '0.7';
          button.style.cursor = 'not-allowed';
        });
        
        return false;
      }

      if (!isWhatsAppRegistered) {
        showError(phoneInput, errorLabel, 'Nomor sudah terdaftar. Silakan hubungi sales kami.');
        
        // Kembalikan tombol ke keadaan normal namun tetap disabled
        submitButtons.forEach(button => {
          const originalText = button.getAttribute('data-original-text');
          button.innerHTML = originalText;
          button.disabled = true;
          button.style.opacity = '0.7';
          button.style.cursor = 'not-allowed';
        });
        
        return false;
      }
      
      // Jika nomor valid di WhatsApp
      phoneInput.style.borderColor = '#28a745';
      if (errorLabel) {
        errorLabel.textContent = 'Nomor WhatsApp valid';
        errorLabel.style.color = '#28a745';
        errorLabel.style.display = 'block';
        
        // Sembunyikan pesan sukses setelah 2 detik
        setTimeout(() => {
          errorLabel.style.display = 'none';
          phoneInput.style.borderColor = '';
        }, 2000);
      }
      
      // Aktifkan kembali tombol
      submitButtons.forEach(button => {
        const originalText = button.getAttribute('data-original-text');
        button.innerHTML = originalText;
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      });
      
      return true;
    } catch (error) {
      console.error('Error during WhatsApp validation:', error);
      
      // Kembalikan tombol ke keadaan normal, aktifkan tombol untuk fallback
      submitButtons.forEach(button => {
        const originalText = button.getAttribute('data-original-text');
        button.innerHTML = originalText;
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      });
      
      // Tampilkan pesan error karena kesalahan teknis
      if (errorLabel) {
        errorLabel.textContent = 'Tidak dapat memverifikasi nomor WhatsApp saat ini';
        errorLabel.style.color = '#ffc107';
        errorLabel.style.display = 'block';
      }
      
      return true; // Return true agar form masih bisa disubmit jika terjadi error teknis
    }
  }
  
  // Fungsi untuk memeriksa nomor WhatsApp via API Fonnte
  async function checkWhatsAppNumber(phoneNumber) {
    // Normalisasi nomor telepon ke format internasional
    let normalizedNumber = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      normalizedNumber = '62' + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('+62')) {
      normalizedNumber = phoneNumber.substring(1);
    }
  
    // URL API Fonnte untuk validasi nomor WhatsApp yang benar
    const apiUrl = 'https://api.fonnte.com/validate';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'ukRFDUrYGAEusgqnH9rD' // Ganti dengan API key Fonnte Anda
        },
        body: JSON.stringify({
          target: normalizedNumber
        })
      });
      
      const data = await response.json();
      
      // Periksa respons dari API Fonnte dengan format yang benar
      if (data.status === true) {
        // Cek apakah nomor ada di array registered
        if (data.registered && data.registered.includes(normalizedNumber)) {
          return true;
        } else {
          return false;
        }
      } else {
        console.error('Error validating WhatsApp number: Invalid API response', data);
        return false;
      }
    } catch (error) {
      console.error('Error checking WhatsApp number:', error);
      // Jika tidak bisa mengecek, throw error untuk ditangani oleh fungsi pemanggil
      throw error;
    }
  }

  // Fungsi untuk memeriksa nomor WhatsApp via API Database
  async function checkWhatsAppNumberRegistered(phoneNumber) {
    // Normalisasi nomor telepon ke format internasional
    let normalizedNumber = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      normalizedNumber = '62' + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('+62')) {
      normalizedNumber = phoneNumber.substring(1);
    }

    // URL API Database untuk validasi nomor WhatsApp terdaftar
    const apiUrl = 'https://pnglabs.my.id/api/form/input/index';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      var isPhoneExist = data.data.some(item => item.nomor_hp.slice(-9) === normalizedNumber.slice(-9));

      return isPhoneExist === false;

    } catch (error) {
      console.error('Error checking WhatsApp number:', error);
      // Jika tidak bisa mengecek, throw error untuk ditangani oleh fungsi pemanggil
      throw error;
    }
  }
  
  // -------------------- Fungsi Anti-Spam --------------------
  
  function saveSubmissionTimestamp() {
    try {
      const now = new Date().getTime();
      localStorage.setItem('lastFormSubmission', now);
      
      // Reset spam counter jika sudah lebih dari 3 hari
      const spamCount = localStorage.getItem('formSpamCount') || 0;
      localStorage.setItem('formSpamCount', parseInt(spamCount) + 1);
      
      // Jika mencoba submit lebih dari 5 kali dalam 3 hari, block untuk 10 tahun
      if (parseInt(spamCount) >= 5) {
        const tenYearsMs = 10 * 365 * 24 * 60 * 60 * 1000;
        localStorage.setItem('formBlocked', new Date().getTime() + tenYearsMs);
        alert('Terdeteksi aktivitas spam. Akses ke form telah dibatasi.');
      }
    } catch (e) {
      console.error('Error saving submission data:', e);
    }
  }
  
  function isRecentlySubmitted() {
    try {
      const lastSubmission = localStorage.getItem('lastFormSubmission');
      if (!lastSubmission) return false;
      
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      
      return (now - parseInt(lastSubmission)) < threeDaysMs;
    } catch (e) {
      console.error('Error checking recent submission:', e);
      return false;
    }
  }
  
  function isBlocked() {
    try {
      const blockedUntil = localStorage.getItem('formBlocked');
      if (!blockedUntil) return false;
      
      const now = new Date().getTime();
      return now < parseInt(blockedUntil);
    } catch (e) {
      console.error('Error checking blocked status:', e);
      return false;
    }
  }
  
  function checkPreviousSubmission() {
    if (isBlocked()) {
      const forms = document.querySelectorAll('.orderonline-embed-form');
      forms.forEach(form => {
        form.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff0000;">Maaf, akses Anda ke form ini telah dibatasi karena aktivitas spam. Silakan hubungi admin untuk informasi lebih lanjut.</div>';
      });
      return;
    }
    
    if (isRecentlySubmitted()) {
      const lastSubmission = localStorage.getItem('lastFormSubmission');
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const timeLeft = threeDaysMs - (now - parseInt(lastSubmission));
      
      const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
      const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      
      const forms = document.querySelectorAll('.orderonline-embed-form');
      forms.forEach(form => {
        // Tambahkan notifikasi di atas form
        const notification = document.createElement('div');
        notification.style.padding = '10px';
        notification.style.backgroundColor = '#fff3cd';
        notification.style.color = '#856404';
        notification.style.borderRadius = '4px';
        notification.style.marginBottom = '15px';
        notification.style.fontSize = '14px';
        notification.textContent = `Anda sudah mengisi form ini dalam 3 hari terakhir. Silakan coba lagi setelah ${days} hari ${hours} jam.`;
        
        form.insertBefore(notification, form.firstChild);
      });
    }
  }