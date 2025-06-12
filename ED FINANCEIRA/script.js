document.addEventListener("DOMContentLoaded", () => {
  // 0) aplica blur ao fundo até aceitar cookies
  document.body.classList.add("blurred");

  // 1) referências aos elementos
  const bgMusic = document.getElementById("bg-music");
  const tickSound = document.getElementById("tick-sound");
  const sectionSound = document.getElementById("section-sound");
  const timerEl = document.getElementById("timer");
  const sections = document.querySelectorAll(
    "section.section, section.section.alt"
  );
  const btnWrapper = document.querySelector(".btn-download-wrapper");
  const seloUI = document.querySelector(".selo-ravenna");
  const elNoti = document.getElementById("notificacaoCompra");
  const cookieBanner = document.getElementById("cookie-banner");
  const acceptBtn = document.getElementById("accept-cookies");
  const muteBtn = document.getElementById("mute-btn");
  const rodape = document.getElementById("rodape");

  // 2) banner de cookies
  acceptBtn.addEventListener("click", () => {
    cookieBanner.style.display = "none";
    document.body.classList.remove("blurred");
    bgMusic.play();
  });

  // 3) botão de mudo
  muteBtn.addEventListener("click", () => {
    bgMusic.muted = !bgMusic.muted;
    muteBtn.textContent = bgMusic.muted ? "🔇" : "🔊";
  });

  // 4) timer com tick sonoro
  let min = 3,
    sec = 47;
  function atualizarTimer() {
    if (sec === 0) {
      if (min === 0) {
        timerEl.textContent = "00:00";
        bgMusic.pause();
        return;
      }
      min--;
      sec = 59;
    } else {
      sec--;
    }
    tickSound.currentTime = 0;
    tickSound.volume = 0.08;
    tickSound.play().catch(() => {});
    timerEl.textContent = `${String(min).padStart(2, "0")}:${String(
      sec
    ).padStart(2, "0")}`;
    setTimeout(atualizarTimer, 1000);
  }
  atualizarTimer();

  // 5) mensagens falsas de compra embaralhadas e aleatórias
  const mensagens = [
    "🔔 João Silva de São Paulo acabou de baixar!",
    "🔔 Maria Oliveira de Belo Horizonte acabou de baixar!",
    "🔔 Pedro Souza de Salvador acabou de baixar!",
    // …outras mensagens…
  ];
  (function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  })(mensagens);

  let msgIndex = 0;
  function mostrarMensagemAleatoria() {
    elNoti.textContent = mensagens[msgIndex];
    elNoti.style.opacity = "1";
    setTimeout(() => {
      elNoti.style.opacity = "0";
    }, 2000);
    msgIndex = (msgIndex + 1) % mensagens.length;
    const delay = Math.random() * 15000 + 5000;
    setTimeout(mostrarMensagemAleatoria, delay);
  }
  mostrarMensagemAleatoria();

  // 6) esconde botão de download ao chegar no rodapé
  function verificarRodape() {
    const r = rodape.getBoundingClientRect();
    if (r.top < window.innerHeight - btnWrapper.offsetHeight) {
      btnWrapper.style.opacity = "0";
      btnWrapper.style.pointerEvents = "none";
    } else {
      btnWrapper.style.opacity = "1";
      btnWrapper.style.pointerEvents = "auto";
    }
  }
  window.addEventListener("scroll", verificarRodape);
  window.addEventListener("resize", verificarRodape);
  verificarRodape();

  // 7) blur/foco de seções com som ao mudar
  let lastActive = null,
    uiTimer;
  function onScroll() {
    const midY = window.innerHeight / 2;
    let closest = null,
      minDist = Infinity;
    sections.forEach((sec) => {
      const r = sec.getBoundingClientRect();
      const secMid = (r.top + r.bottom) / 2;
      const dist = Math.abs(midY - secMid);
      if (dist < minDist) {
        minDist = dist;
        closest = sec;
      }
    });
    if (closest && closest !== lastActive) {
      sectionSound.currentTime = 0;
      sectionSound.volume = 0.08;
      sectionSound.play().catch(() => {});
      lastActive = closest;
    }
    sections.forEach((sec) => sec.classList.toggle("active", sec === closest));
    btnWrapper.classList.add("ui--blur");
    seloUI.classList.add("ui--blur");
    clearTimeout(uiTimer);
    uiTimer = setTimeout(() => {
      btnWrapper.classList.remove("ui--blur");
      seloUI.classList.remove("ui--blur");
    }, 2000);
  }
  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", onScroll);
  onScroll();

  // 8) coverflow sem autoplay
  const inner = document.getElementById("coverflow-inner");
  const items = inner.children;
  const next = document.querySelector(".coverflow-nav.next");
  const prev = document.querySelector(".coverflow-nav.prev");
  const n = items.length;
  let indexCover = 0;

  function rotateCoverflow() {
    const angle = indexCover * -(360 / n);
    const radius = Math.round(
      items[0].offsetWidth / (2 * Math.tan(Math.PI / n))
    );
    inner.style.transform = `translateZ(-${radius}px) rotateY(${angle}deg)`;
  }

  next.addEventListener("click", () => {
    indexCover = (indexCover + 1) % n;
    rotateCoverflow();
  });
  prev.addEventListener("click", () => {
    indexCover = (indexCover - 1 + n) % n;
    rotateCoverflow();
  });
  rotateCoverflow();
});

document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector("#testimonials-slider .slider");
  if (!container) return;

  const testimonialSlides = Array.from(
    container.querySelectorAll(".slide.testimonial")
  );

  const printConfigs = [
    { position: 1, src: "imagens/print1.png", alt: "Print depoimento 1" },
    { position: 1, src: "imagens/print1a.png", alt: "Print extra 1" },
    { position: 1, src: "imagens/print1b.png", alt: "Print extra 2" },
    { position: 2, src: "imagens/print2.png", alt: "Print depoimento 2" },
    { position: 3, src: "imagens/print3.png", alt: "Print depoimento 3" },
    { position: 4, src: "imagens/print4.png", alt: "Print depoimento 4" },
  ];

  const finalSlides = [];
  testimonialSlides.forEach((slide, idx) => {
    finalSlides.push(slide);
    printConfigs
      .filter((cfg) => cfg.position === idx + 1)
      .forEach((cfg) => {
        const printSlide = document.createElement("div");
        printSlide.classList.add("slide", "screenshot");
        printSlide.innerHTML = `
          <img src="${cfg.src}" alt="${cfg.alt}" />
        `;
        finalSlides.push(printSlide);
      });
  });

  container.innerHTML = "";
  finalSlides.forEach((sl) => container.appendChild(sl));

  const slides = Array.from(container.children);
  let index = 0;
  const total = slides.length;
  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");

  function updateSlides() {
    slides.forEach((s, i) => s.classList.toggle("active", i === index));
  }

  nextBtn.addEventListener("click", () => {
    index = (index + 1) % total;
    updateSlides();
  });
  prevBtn.addEventListener("click", () => {
    index = (index - 1 + total) % total;
    updateSlides();
  });

  updateSlides();
});

document.addEventListener("click", function (e) {
  const clickedPrint = e.target.closest(".slide.screenshot img");

  // Clicou em um print
  if (clickedPrint) {
    // Cria a visualização em tela cheia
    const overlay = document.createElement("div");
    overlay.classList.add("print-fullscreen");

    const img = document.createElement("img");
    img.src = clickedPrint.src;
    img.alt = clickedPrint.alt;

    overlay.appendChild(img);
    document.body.appendChild(overlay);

    // Ao clicar na tela cheia, ela desaparece
    overlay.addEventListener("click", () => {
      overlay.remove();
    });
  }
});

// Se rolar a tela, fecha a visualização também
window.addEventListener("scroll", function () {
  const fs = document.querySelector(".print-fullscreen");
  if (fs) fs.remove();
});
