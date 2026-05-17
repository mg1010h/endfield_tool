const Modal = {
  show(title, message, isConfirm = false) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('custom-modal');
      document.getElementById('modal-title').innerText = title;
      document.getElementById('modal-message').innerHTML = message;
      
      const btnCancel = document.getElementById('modal-btn-cancel');
      const btnConfirm = document.getElementById('modal-btn-confirm');
      
      if (isConfirm) btnCancel.classList.remove('hidden');
      else btnCancel.classList.add('hidden');
      
      overlay.classList.remove('hidden');
      
      btnConfirm.onclick = () => { overlay.classList.add('hidden'); resolve(true); };
      btnCancel.onclick = () => { overlay.classList.add('hidden'); resolve(false); };
    });
  },
  alert(message) { return this.show("알림", message, false); },
  confirm(message) { return this.show("확인", message, true); }
};

export default Modal;
