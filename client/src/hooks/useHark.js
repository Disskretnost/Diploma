import { useEffect, useState } from 'react';

const useHark = (stream, options = {}) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [volume, setVolume] = useState(-100);

    useEffect(() => {
        if (!stream) return;

        const AudioContextType = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextType) return;

        const audioContext = new AudioContextType();
        const analyser = audioContext.createAnalyser();
        const sourceNode = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = options.smoothing || 0.1;

        sourceNode.connect(analyser);
        if (options.play) analyser.connect(audioContext.destination);

        const fftBins = new Float32Array(analyser.fftSize);
        const threshold = options.threshold || -50;
        const history = new Array(options.history || 10).fill(0);
        let running = true;

        const getMaxVolume = () => {
            analyser.getFloatFrequencyData(fftBins);
            let maxVolume = -Infinity;
            for (let i = 4; i < fftBins.length; i++) {
                if (fftBins[i] > maxVolume && fftBins[i] < 0) {
                    maxVolume = fftBins[i];
                }
            }
            return maxVolume;
        };

        const checkSpeaking = () => {
            if (!running) return;

            const currentVolume = getMaxVolume();
            setVolume(currentVolume);

            // Update history
            history.shift();
            history.push(currentVolume > threshold ? 1 : 0);

            // Check if the user is speaking
            const recentHistory = history.slice(-3).reduce((a, b) => a + b, 0);
            if (currentVolume > threshold && !isSpeaking && recentHistory >= 2) {
                setIsSpeaking(true);
            } else if (currentVolume < threshold && isSpeaking && history.every(v => v === 0)) {
                setIsSpeaking(false);
            }

            // Schedule the next check
            setTimeout(checkSpeaking, options.interval || 50);
        };

        checkSpeaking();

        return () => {
            running = false;
            sourceNode.disconnect();
            analyser.disconnect();
            if (options.play) audioContext.close();
        };
    }, [stream, options, isSpeaking]); // Add `isSpeaking` to dependencies

    return { isSpeaking, volume };
};

export default useHark;