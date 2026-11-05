(() => {
  // If static/glb_frames/samples.json exists, it will override this fallback list.
  // Expected naming per sample:
  // static/glb_frames/<sample_key>/frame_000.glb, frame_001.glb, ...
  // Order: growth first, reverse second, each in species order.
  const FALLBACK_SAMPLES = [
    { key: "growth_dahlia", label: "Dahlia Growth", frameCount: 1 },
    { key: "growth_daisy", label: "Daisy Growth", frameCount: 1 },
    { key: "growth_hibiscus", label: "Hibiscus Growth", frameCount: 1 },
    { key: "growth_lily", label: "Lily Growth", frameCount: 1 },
    { key: "growth_rose", label: "Rose Growth", frameCount: 1 },
    { key: "reverse_dahlia", label: "Dahlia Reverse", frameCount: 1 },
    { key: "reverse_daisy", label: "Daisy Reverse", frameCount: 1 },
    { key: "reverse_hibiscus", label: "Hibiscus Reverse", frameCount: 1 },
    { key: "reverse_lily", label: "Lily Reverse", frameCount: 1 },
    { key: "reverse_rose", label: "Rose Reverse", frameCount: 1 },
  ];
  const DESIRED_SAMPLE_KEY_ORDER = [
    "growth_dahlia",
    "growth_daisy",
    "growth_hibiscus",
    "growth_lily",
    "growth_rose",
    "reverse_dahlia",
    "reverse_daisy",
    "reverse_hibiscus",
    "reverse_lily",
    "reverse_rose",
  ];

  const MANIFEST_PATH = "./static/glb_frames/samples.json";
  const FRAME_ROOT = "./static/glb_frames/";
  const FRAME_SUFFIX = ".glb";
  const FRAME_PADDING = 3;
  const FRAME_INTERVAL_MS = 800;

  const viewer = document.getElementById("flora-viewer");
  const sampleSelector = document.getElementById("sample-selector");
  const slider = document.getElementById("frame-slider");
  const frameText = document.getElementById("frame-text");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const playPauseLabel = document.getElementById("play-pause-label");

  if (!viewer || !sampleSelector || !slider || !frameText || !playPauseBtn || !playPauseLabel) {
    return;
  }

  const buildFrameFiles = (sampleKey, frameCount) =>
    Array.from({ length: frameCount }, (_, index) => {
      const frameIndex = String(index).padStart(FRAME_PADDING, "0");
      return `${FRAME_ROOT}${sampleKey}/frame_${frameIndex}${FRAME_SUFFIX}`;
    });

  const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

  const formatLabelFromKey = (sampleKey) => {
    const match = /^([a-z]+)_([a-z]+)$/.exec(sampleKey);
    if (!match) {
      return null;
    }
    const order = match[1];
    const species = match[2];
    if (order !== "growth" && order !== "reverse") {
      return null;
    }
    return `${capitalize(species)} ${capitalize(order)}`;
  };

  const reorderSamples = (samples) => {
    const byKey = new Map(samples.map((sample) => [sample.key, sample]));
    const ordered = [];
    DESIRED_SAMPLE_KEY_ORDER.forEach((key) => {
      if (byKey.has(key)) {
        ordered.push(byKey.get(key));
      }
    });
    samples.forEach((sample) => {
      if (!DESIRED_SAMPLE_KEY_ORDER.includes(sample.key)) {
        ordered.push(sample);
      }
    });
    return ordered;
  };

  let sampleStates = [];
  let activeSampleIndex = 0;
  let currentFrame = 0;
  let isPlaying = false;
  let timerId = null;
  let sampleButtons = [];
  let viewerLoadToken = 0;

  const getActiveSample = () => sampleStates[activeSampleIndex];

  const setPlayButtonState = () => {
    const iconElement = playPauseBtn.querySelector("i");
    if (isPlaying) {
      playPauseLabel.textContent = "Pause";
      if (iconElement) {
        iconElement.className = "fas fa-pause";
      }
    } else {
      playPauseLabel.textContent = "Play";
      if (iconElement) {
        iconElement.className = "fas fa-play";
      }
    }
  };

  const applyNormalizedScaleForSample = (sampleState) => {
    if (typeof viewer.getDimensions !== "function") {
      return;
    }
    const dimensions = viewer.getDimensions();
    if (!dimensions) {
      return;
    }
    const sizeX = Number(dimensions.x);
    const sizeY = Number(dimensions.y);
    const sizeZ = Number(dimensions.z);
    if (!Number.isFinite(sizeX) || !Number.isFinite(sizeY) || !Number.isFinite(sizeZ)) {
      return;
    }
    const currentMaxSize = Math.max(sizeX, sizeY, sizeZ);
    if (!(currentMaxSize > 0)) {
      return;
    }

    if (!(sampleState.referenceMaxSize > 0)) {
      sampleState.referenceMaxSize = currentMaxSize;
    }
    const normalizedScale = sampleState.referenceMaxSize / currentMaxSize;
    viewer.setAttribute("scale", `${normalizedScale} ${normalizedScale} ${normalizedScale}`);
  };

  const updateViewer = (frameIndex) => {
    const activeSample = getActiveSample();
    currentFrame = frameIndex;
    activeSample.currentFrame = frameIndex;
    viewerLoadToken += 1;
    const tokenAtSet = viewerLoadToken;
    viewer.setAttribute("scale", "1 1 1");
    viewer.src = activeSample.frameFiles[currentFrame];
    viewer.addEventListener(
      "load",
      () => {
        if (tokenAtSet !== viewerLoadToken) {
          return;
        }
        applyNormalizedScaleForSample(activeSample);
      },
      { once: true }
    );
    slider.value = String(currentFrame);
    frameText.textContent = `${currentFrame + 1} / ${activeSample.frameFiles.length}`;
  };

  const stopPlayback = () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  const startPlayback = () => {
    const activeSample = getActiveSample();
    stopPlayback();
    if (!isPlaying || activeSample.frameFiles.length <= 1) {
      return;
    }
    timerId = window.setInterval(() => {
      const nextFrame = (currentFrame + 1) % activeSample.frameFiles.length;
      updateViewer(nextFrame);
    }, FRAME_INTERVAL_MS);
  };

  const syncControlsForActiveSample = () => {
    const activeSample = getActiveSample();
    slider.min = "0";
    slider.max = String(Math.max(activeSample.frameFiles.length - 1, 0));
    slider.step = "1";
    playPauseBtn.disabled = activeSample.frameFiles.length <= 1;
    if (activeSample.frameFiles.length <= 1) {
      isPlaying = false;
    }
    frameText.textContent = `${activeSample.currentFrame + 1} / ${activeSample.frameFiles.length}`;
    setPlayButtonState();
  };

  const switchSample = (sampleIndex) => {
    if (sampleIndex < 0 || sampleIndex >= sampleStates.length) {
      return;
    }
    activeSampleIndex = sampleIndex;
    const activeSample = getActiveSample();
    currentFrame = Math.min(activeSample.currentFrame, activeSample.frameFiles.length - 1);
    if (currentFrame < 0) {
      currentFrame = 0;
    }
    sampleButtons.forEach((button, index) => {
      button.classList.toggle("is-active", index === activeSampleIndex);
    });
    syncControlsForActiveSample();
    updateViewer(currentFrame);
    startPlayback();
  };

  const renderSampleButtons = () => {
    sampleSelector.innerHTML = "";
    sampleButtons = sampleStates.map((sample, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sample-btn";
      button.textContent = sample.label;
      if (typeof sample.sceneName === "string" && sample.sceneName.length > 0) {
        button.title = sample.sceneName;
      }
      button.addEventListener("click", () => {
        switchSample(index);
      });
      sampleSelector.appendChild(button);
      return button;
    });
  };

  slider.addEventListener("input", (event) => {
    if (sampleStates.length === 0) {
      return;
    }
    const activeSample = getActiveSample();
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const nextFrame = Number(target.value);
    if (Number.isNaN(nextFrame) || nextFrame < 0 || nextFrame >= activeSample.frameFiles.length) {
      return;
    }
    updateViewer(nextFrame);
  });

  playPauseBtn.addEventListener("click", () => {
    if (sampleStates.length === 0) {
      return;
    }
    isPlaying = !isPlaying;
    setPlayButtonState();
    if (isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
  });

  const isValidManifestSamples = (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return false;
    }
    return value.every((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }
      if (typeof item.key !== "string" || item.key.length === 0) {
        return false;
      }
      if (typeof item.label !== "string" || item.label.length === 0) {
        return false;
      }
      if (!Number.isInteger(item.frameCount) || item.frameCount <= 0) {
        return false;
      }
      return true;
    });
  };

  const initializeSamples = async () => {
    let samples = FALLBACK_SAMPLES;
    try {
      const response = await fetch(MANIFEST_PATH, { cache: "no-store" });
      if (response.ok) {
        const manifest = await response.json();
        if (isValidManifestSamples(manifest)) {
          samples = manifest;
        }
      }
    } catch (_error) {
      // Fallback to static config when manifest is absent.
    }

    const normalizedSamples = reorderSamples(samples).map((sample) => {
      const normalizedLabel = formatLabelFromKey(sample.key);
      return {
        ...sample,
        label: normalizedLabel ?? sample.label,
      };
    });

    sampleStates = normalizedSamples.map((sample) => ({
      ...sample,
      frameFiles: buildFrameFiles(sample.key, sample.frameCount),
      currentFrame: 0,
      referenceMaxSize: 0,
    }));
    if (sampleStates.length === 0) {
      return;
    }
    isPlaying = sampleStates[0].frameFiles.length > 1;
    renderSampleButtons();
    switchSample(0);
  };

  void initializeSamples();
})();
