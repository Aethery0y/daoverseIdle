import { useEffect, useRef } from "react";

interface ParticleSystemProps {
    density?: number;
    color?: string;
    speed?: number;
    className?: string;
}

export function ParticleSystem({
    density = 30,
    color = "#a855f7",
    speed = 0.5,
    className = ""
}: ParticleSystemProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Particle class
        class Particle {
            x: number;
            y: number;
            size: number;
            speedY: number;
            opacity: number;
            fadeSpeed: number;

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1;
                this.speedY = -Math.random() * speed - 0.2;
                this.opacity = Math.random() * 0.5 + 0.2;
                this.fadeSpeed = Math.random() * 0.01 + 0.005;
            }

            update() {
                this.y += this.speedY;
                this.opacity -= this.fadeSpeed;

                // Reset particle when it goes off screen or fades out
                if (this.y < 0 || this.opacity <= 0) {
                    this.y = canvas.height;
                    this.x = Math.random() * canvas.width;
                    this.opacity = Math.random() * 0.5 + 0.2;
                }
            }

            draw() {
                ctx.fillStyle = `${color}${Math.floor(this.opacity * 255).toString(16).padStart(2, '0')}`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // Add glow effect
                ctx.shadowBlur = 10;
                ctx.shadowColor = color;
            }
        }

        // Create particles
        const particles: Particle[] = [];
        for (let i = 0; i < density; i++) {
            particles.push(new Particle());
        }

        // Animation loop
        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationId);
        };
    }, [density, color, speed]);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none ${className}`}
            style={{ width: "100%", height: "100%" }}
        />
    );
}
