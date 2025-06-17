// ===== SISTEMA DE ÁUDIO AVANÇADO =====
const AudioSystem = {
  state: {
    audioEnabled: false,
    bgMusicMuted: false,
    sectionMuted: false,
    bgMusicReady: false,
    tickSoundReady: false,
    sectionSoundReady: false,
    currentSection: null,
  },
  elements: {},

  init() {
    this.elements = {
      bgMusic: document.getElementById("bg-music"),
      tickSound: document.getElementById("tick-sound"),
      sectionSound: document.getElementById("section-sound"),
      muteBtn: document.getElementById("mute-btn"),
      consentBanner: document.getElementById("audio-consent-banner"),
      acceptBtn: document.getElementById("accept-audio"),
      rejectBtn: document.getElementById("reject-audio"),
    };

    this.setupAudioElements();
    this.setupConsentSystem();
    this.setupMuteButton();

    console.log("🎵 Sistema de Áudio inicializado");
  },

  setupAudioElements() {
    // Configurar música de fundo
    if (this.elements.bgMusic) {
      this.elements.bgMusic.volume = 0.15;
      this.elements.bgMusic.loop = true;
      this.elements.bgMusic.addEventListener("canplay", () => {
        this.state.bgMusicReady = true;
        console.log("🎼 Música de fundo carregada");
      });
    }

    // Configurar som de tick
    if (this.elements.tickSound) {
      this.elements.tickSound.volume = 0.3;
      this.elements.tickSound.addEventListener("canplay", () => {
        this.state.tickSoundReady = true;
        console.log("🔔 Som de tick carregado");
      });
    }

    // Configurar som de seção
    if (this.elements.sectionSound) {
      this.elements.sectionSound.volume = 0.2;
      this.elements.sectionSound.addEventListener("canplay", () => {
        this.state.sectionSoundReady = true;
        console.log("🌊 Som de seção carregado");
      });
    }
  },

  setupConsentSystem() {
    if (!this.elements.acceptBtn || !this.elements.rejectBtn) return;

    this.elements.acceptBtn.addEventListener("click", () => {
      this.acceptAudio();
    });

    this.elements.rejectBtn.addEventListener("click", () => {
      this.rejectAudio();
    });
  },

  acceptAudio() {
    this.state.audioEnabled = true;
    this.hideConsentBanner();
    this.startBackgroundMusic();
    console.log("✅ Áudio aceito pelo usuário");
  },

  rejectAudio() {
    this.state.audioEnabled = false;
    this.hideConsentBanner();
    console.log("❌ Áudio rejeitado pelo usuário");
  },

  hideConsentBanner() {
    if (this.elements.consentBanner) {
      this.elements.consentBanner.classList.add("hidden");
    }
  },

  async startBackgroundMusic() {
    if (
      !this.state.audioEnabled ||
      !this.elements.bgMusic ||
      this.state.bgMusicMuted
    )
      return;

    try {
      await this.elements.bgMusic.play();
      console.log("🎵 Música de fundo iniciada");
    } catch (error) {
      console.warn("⚠️ Erro ao iniciar música:", error.message);
    }
  },

  async playTickSound() {
    if (!this.state.audioEnabled || !this.elements.tickSound) return;

    try {
      this.elements.tickSound.currentTime = 0;
      await this.elements.tickSound.play();
    } catch (error) {
      console.warn("⚠️ Erro no tick sound:", error.message);
    }
  },

  async playSectionSound() {
    if (
      !this.state.audioEnabled ||
      !this.elements.sectionSound ||
      this.state.sectionMuted
    )
      return;

    try {
      this.elements.sectionSound.currentTime = 0;
      await this.elements.sectionSound.play();
      console.log("🌊 Som de seção reproduzido");
    } catch (error) {
      console.warn("⚠️ Erro no section sound:", error.message);
    }
  },

  setupMuteButton() {
    if (!this.elements.muteBtn) return;

    this.elements.muteBtn.addEventListener("click", () => {
      this.toggleMute();
    });
  },

  toggleMute() {
    // Alternar estado de mute (só bg-music e section, nunca tick)
    const wasMuted = this.state.bgMusicMuted && this.state.sectionMuted;

    this.state.bgMusicMuted = !wasMuted;
    this.state.sectionMuted = !wasMuted;

    // Aplicar mute na música de fundo
    if (this.elements.bgMusic) {
      this.elements.bgMusic.muted = this.state.bgMusicMuted;
    }

    // Atualizar botão
    if (this.elements.muteBtn) {
      if (wasMuted) {
        this.elements.muteBtn.textContent = "🔊";
        this.elements.muteBtn.classList.remove("muted");
        this.elements.muteBtn.setAttribute("aria-pressed", "false");
        // Retomar música se estava tocando
        if (this.state.audioEnabled && this.elements.bgMusic.paused) {
          this.startBackgroundMusic();
        }
      } else {
        this.elements.muteBtn.textContent = "🔇";
        this.elements.muteBtn.classList.add("muted");
        this.elements.muteBtn.setAttribute("aria-pressed", "true");
        // Pausar música
        if (this.elements.bgMusic) {
          this.elements.bgMusic.pause();
        }
      }
    }

    console.log(
      `🔊 Áudio ${wasMuted ? "desmutado" : "mutado"} (tick sempre ativo)`
    );
  },
};

// ===== FUNÇÃO THROTTLE =====
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// ===== INICIALIZAÇÃO PRINCIPAL =====
document.addEventListener("DOMContentLoaded", () => {
  const AppState = {
    timerInterval: null,
    isTimerRunning: false,
    currentSlideIndex: 0,
    totalSlides: 0,
    lastActiveSection: null,
  };

  const elements = {
    timerEl: document.getElementById("timer"),
    sections: document.querySelectorAll("section"),
    btnWrapper: document.querySelector(".btn-download-wrapper"),
    notificationEl: document.getElementById("notificacaoCompra"),
    footer: document.getElementById("rodape"),
    sliderContainer: document.querySelector("#testimonials-slider .slider"),
    prevBtn: document.querySelector(".testimonials .prev"),
    nextBtn: document.querySelector(".testimonials .next"),
  };

  // Inicializar sistema de áudio
  AudioSystem.init();

  // ===== SISTEMA DE TIMER COM SOM =====
  function initTimer() {
    if (!elements.timerEl) return;

    let minutes = 3;
    let seconds = 47;
    AppState.isTimerRunning = true;

    function updateTimer() {
      if (!AppState.isTimerRunning) return;

      if (minutes === 0 && seconds === 0) {
        elements.timerEl.textContent = "EXPIRADO";
        AppState.isTimerRunning = false;
        if (AppState.timerInterval) {
          clearInterval(AppState.timerInterval);
          AppState.timerInterval = null;
        }
        return;
      }

      if (seconds === 0) {
        minutes--;
        seconds = 59;
      } else {
        seconds--;
      }

      // SOM DE TICK (sempre ativo)
      AudioSystem.playTickSound();

      const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
      elements.timerEl.textContent = formattedTime;
    }

    console.log("⏰ Timer iniciado: 03:47");
    AppState.timerInterval = setInterval(updateTimer, 1000);
  }

  // ===== DETECÇÃO DE MUDANÇA DE SEÇÃO =====
  function initSectionDetection() {
    if (!elements.sections.length) return;

    function handleSectionChange() {
      const viewportCenter = window.innerHeight / 2;
      let closestSection = null;
      let minDistance = Infinity;

      elements.sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionCenter = (rect.top + rect.bottom) / 2;
        const distance = Math.abs(viewportCenter - sectionCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestSection = section;
        }
      });

      // Reproduzir som quando muda de seção
      if (closestSection && closestSection !== AppState.lastActiveSection) {
        if (AppState.lastActiveSection !== null) {
          AudioSystem.playSectionSound();
        }
        AppState.lastActiveSection = closestSection;
        console.log(
          "📍 Seção ativa:",
          closestSection.className || closestSection.tagName
        );
      }
    }

    const throttledHandler = throttle(handleSectionChange, 200);
    window.addEventListener("scroll", throttledHandler, { passive: true });
  }

  // ===== NOTIFICAÇÕES FOMO =====
  function initFomoNotifications() {
    if (!elements.notificationEl) return;

    const messages = [
      "🔔 João Silva de São Paulo acabou de baixar!",
      "🔔 Maria Oliveira de Belo Horizonte acabou de baixar!",
      "🔔 Pedro Souza de Salvador acabou de baixar!",
      "🔔 Ana Costa de Brasília acabou de baixar!",
      "🔔 Carlos Santos de Fortaleza acabou de baixar!",
      "🔔 Juliana Lima de Recife acabou de baixar!",
    ];

    function shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    const shuffledMessages = shuffleArray(messages);
    let messageIndex = 0;

    function showRandomNotification() {
      const message = shuffledMessages[messageIndex];
      elements.notificationEl.textContent = message;
      elements.notificationEl.classList.add("show");

      setTimeout(() => {
        elements.notificationEl.classList.remove("show");
      }, 3000);

      messageIndex = (messageIndex + 1) % shuffledMessages.length;
      const nextDelay = Math.random() * 12000 + 8000;
      setTimeout(showRandomNotification, nextDelay);
    }

    setTimeout(showRandomNotification, 5000);
  }

  // ===== CONTROLE DE VISIBILIDADE DO BOTÃO =====
  function initButtonVisibility() {
    if (!elements.btnWrapper || !elements.footer) return;

    function checkFooterVisibility() {
      const footerRect = elements.footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const buttonHeight = elements.btnWrapper.offsetHeight;

      if (footerRect.top < windowHeight - buttonHeight) {
        elements.btnWrapper.style.opacity = "0";
        elements.btnWrapper.style.pointerEvents = "none";
      } else {
        elements.btnWrapper.style.opacity = "1";
        elements.btnWrapper.style.pointerEvents = "auto";
      }
    }

    const throttledCheck = throttle(checkFooterVisibility, 100);
    window.addEventListener("scroll", throttledCheck, { passive: true });
    window.addEventListener("resize", throttledCheck);
    checkFooterVisibility();
  }

  // ===== SLIDER DE DEPOIMENTOS =====
  function initTestimonialsSlider() {
    if (!elements.sliderContainer) return;

    const testimonialSlides = Array.from(
      elements.sliderContainer.querySelectorAll(".slide.testimonial")
    );

    if (testimonialSlides.length === 0) return;

    const printConfigs = [
      {
        position: 1,
        src: "imagens/print1.png",
        alt: "Print depoimento WhatsApp 1",
      },
      {
        position: 1,
        src: "imagens/print1a.png",
        alt: "Print depoimento WhatsApp 1A",
      },
      {
        position: 1,
        src: "imagens/print1b.png",
        alt: "Print depoimento WhatsApp 1B",
      },
      {
        position: 2,
        src: "imagens/print2.png",
        alt: "Print depoimento WhatsApp 2",
      },
      {
        position: 3,
        src: "imagens/print3.png",
        alt: "Print depoimento WhatsApp 3",
      },
      {
        position: 4,
        src: "imagens/print4.png",
        alt: "Print depoimento WhatsApp 4",
      },
    ];

    const finalSlides = [];

    testimonialSlides.forEach((slide, index) => {
      finalSlides.push(slide);
      printConfigs
        .filter((config) => config.position === index + 1)
        .forEach((config) => {
          const printSlide = document.createElement("div");
          printSlide.classList.add("slide", "screenshot");
          printSlide.innerHTML = `<img src="${config.src}" alt="${config.alt}" loading="lazy" />`;
          finalSlides.push(printSlide);
        });
    });

    elements.sliderContainer.innerHTML = "";
    finalSlides.forEach((slide) => elements.sliderContainer.appendChild(slide));

    const allSlides = Array.from(elements.sliderContainer.children);
    AppState.totalSlides = allSlides.length;
    AppState.currentSlideIndex = 0;

    function updateSlides() {
      allSlides.forEach((slide, index) => {
        slide.classList.toggle("active", index === AppState.currentSlideIndex);
      });
    }

    function nextSlide() {
      AppState.currentSlideIndex =
        (AppState.currentSlideIndex + 1) % AppState.totalSlides;
      updateSlides();
    }

    function prevSlide() {
      AppState.currentSlideIndex =
        (AppState.currentSlideIndex - 1 + AppState.totalSlides) %
        AppState.totalSlides;
      updateSlides();
    }

    if (elements.nextBtn) {
      elements.nextBtn.addEventListener("click", nextSlide);
    }

    if (elements.prevBtn) {
      elements.prevBtn.addEventListener("click", prevSlide);
    }

    updateSlides();
  }

  // ===== VISUALIZAÇÃO EM TELA CHEIA =====
  function initFullscreenViewer() {
    document.addEventListener("click", (event) => {
      const clickedPrint = event.target.closest(".slide.screenshot img");

      if (clickedPrint) {
        event.preventDefault();
        const overlay = document.createElement("div");
        overlay.classList.add("print-fullscreen");

        const img = document.createElement("img");
        img.src = clickedPrint.src;
        img.alt = clickedPrint.alt;
        img.loading = "eager";

        overlay.appendChild(img);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", () => {
          overlay.remove();
        });

        const handleEscape = (e) => {
          if (e.key === "Escape") {
            overlay.remove();
            document.removeEventListener("keydown", handleEscape);
          }
        };

        document.addEventListener("keydown", handleEscape);
      }
    });
  }

  // ===== INICIALIZAÇÃO =====
  function initializeApp() {
    console.log("🚀 Iniciando Landing Page com Sistema de Áudio...");

    initTimer();
    initSectionDetection();
    initFomoNotifications();
    initButtonVisibility();
    initTestimonialsSlider();
    initFullscreenViewer();

    console.log("✅ Landing Page inicializada com sucesso!");
  }

  initializeApp();

  // ===== CLEANUP =====
  window.addEventListener("beforeunload", () => {
    if (AppState.timerInterval) {
      clearInterval(AppState.timerInterval);
    }
  });
});

// ===== FUNÇÃO DE DOWNLOAD =====
window.iniciarDownload = function () {
  console.log("💰 Iniciando processo de conversão...");

  if (typeof gtag !== "undefined") {
    gtag("event", "purchase_intent", {
      event_category: "Conversão",
      event_label: "CTA Principal - R$580+ em 12 dias",
      value: 23.97,
      currency: "BRL",
    });
  }

  alert(`🎉 Redirecionando para o checkout seguro!

💡 Em instantes você terá acesso ao método que já transformou a vida de 2.324 brasileiros!

✅ Você receberá:
- E-book completo no seu email
- Acesso imediato após pagamento  
- Suporte via WhatsApp
- Garantia de satisfação

🔒 Pagamento 100% seguro`);
};

// ===== FERRAMENTAS DE DEBUG =====
console.log("🎵 Sistema de Áudio implementado com:");
console.log("- Música de fundo (bg-music)");
console.log("- Som de tick no timer (sempre ativo)");
console.log("- Som ao mudar de seção (section-sound)");
console.log("- Botão mute (só bg-music e section)");
console.log("- Banner de consentimento disfarçado");
