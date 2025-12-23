"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { SignalBadge } from "@/components/ui/signal-badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

interface Step {
  number: number;
  title: string;
  content: React.ReactNode;
}

function StepCard({ step, delay }: { step: Step; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--accent-cyan-glow)] border border-[var(--accent-cyan)] flex items-center justify-center">
            <span className="font-mono font-bold text-[var(--accent-cyan)]">
              {step.number}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">
              {step.title}
            </h3>
            <div className="text-sm text-[var(--text-secondary)] space-y-3">
              {step.content}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
      {title && (
        <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {title}
          </span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code className="font-mono text-sm text-[var(--text-primary)]">
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function GettingStartedPage() {
  const prerequisites = [
    { icon: "Monitor", label: "Reachy Mini or Reachy Mini Lite", required: true },
    { icon: "Cable", label: "USB-C cable (for Lite)", required: true },
    { icon: "Cpu", label: "Python 3.10+ installed", required: true },
    { icon: "Terminal", label: "Terminal access", required: true },
    { icon: "Wifi", label: "Network connection (for apps)", required: false },
  ];

  const steps: Step[] = [
    {
      number: 1,
      title: "Connect Your Robot",
      content: (
        <>
          <p>
            Connect Reachy Mini Lite to your computer via USB-C. The robot should
            power on automatically — you&apos;ll see the antenna LEDs light up.
          </p>
          <p className="mt-2">
            <strong className="text-[var(--text-primary)]">Reachy Mini (Full):</strong>{" "}
            Connect via WiFi instead. The robot broadcasts its own network on first boot.
          </p>
        </>
      ),
    },
    {
      number: 2,
      title: "Install the SDK",
      content: (
        <>
          <p className="mb-3">
            Create a virtual environment and install the Reachy Mini SDK:
          </p>
          <CodeBlock title="terminal">
{`python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install reachy-mini`}
          </CodeBlock>
        </>
      ),
    },
    {
      number: 3,
      title: "Start the Daemon",
      content: (
        <>
          <p className="mb-3">
            The daemon is the bridge between your code and the robot. Start it in a
            terminal and leave it running:
          </p>
          <CodeBlock title="terminal">
{`# Real robot (default)
reachy-mini-daemon

# Or with explicit port
python -m reachy_mini.daemon.app.main --fastapi-port 8000`}
          </CodeBlock>
          <p className="mt-3">
            Open{" "}
            <a
              href="http://localhost:8000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-cyan)] hover:underline"
            >
              localhost:8000
            </a>{" "}
            to see the dashboard. You should see the robot status and live camera feed.
          </p>
        </>
      ),
    },
    {
      number: 4,
      title: "Your First Movement",
      content: (
        <>
          <p className="mb-3">
            Open a new terminal (keep the daemon running), activate your venv, and
            run this script:
          </p>
          <CodeBlock title="hello_reachy.py">
{`from reachy_mini import ReachyMini
from reachy_mini.utils import create_head_pose

with ReachyMini() as mini:
    # Wave the antennas
    mini.goto_target(antennas=[0.6, -0.6], duration=0.3)
    mini.goto_target(antennas=[-0.6, 0.6], duration=0.3)
    mini.goto_target(antennas=[0, 0], duration=0.3)

    # Nod hello
    mini.goto_target(
        head=create_head_pose(z=15, degrees=True),
        duration=0.5
    )
    mini.goto_target(
        head=create_head_pose(z=-15, degrees=True),
        duration=0.5
    )
    mini.goto_target(
        head=create_head_pose(z=0, degrees=True),
        duration=0.5
    )`}
          </CodeBlock>
          <p className="mt-3">
            Run it with <code className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--accent-cyan)] font-mono text-xs">python hello_reachy.py</code>.
            Your robot should wave its antennas and nod!
          </p>
        </>
      ),
    },
    {
      number: 5,
      title: "Install an App",
      content: (
        <>
          <p className="mb-3">
            Community apps can be installed directly into the dashboard. Try Focus
            Guardian or DJ Reactor:
          </p>
          <CodeBlock title="terminal">
{`# Option 1: Install from HuggingFace
pip install "focus-guardian @ git+https://huggingface.co/spaces/RyeCatcher/focus-guardian"

# Option 2: Install DJ Reactor
pip install "dj-reactor @ git+https://huggingface.co/spaces/RyeCatcher/dj-reactor"`}
          </CodeBlock>
          <p className="mt-3">
            Restart the daemon, then visit the dashboard. Your app appears in the
            Apps tab — click to launch!
          </p>
        </>
      ),
    },
    {
      number: 6,
      title: "Build Your Own",
      content: (
        <>
          <p className="mb-3">
            Ready to create your own app? Use the official template:
          </p>
          <CodeBlock title="terminal">
{`git clone https://github.com/pollen-robotics/reachy_mini_app_example
cd reachy_mini_app_example
pip install -e .`}
          </CodeBlock>
          <p className="mt-3">
            Apps are Gradio interfaces that receive robot control via props. See the{" "}
            <Link href="/apps" className="text-[var(--accent-cyan)] hover:underline">
              Apps page
            </Link>{" "}
            for examples of what&apos;s possible.
          </p>
        </>
      ),
    },
  ];

  const troubleshooting = [
    {
      problem: "Daemon says \"Backend not ready\"",
      solution:
        "Add --headless flag if running without a display, or check USB connection.",
    },
    {
      problem: "Camera timeout errors",
      solution:
        "Normal in headless mode. The SDK works fine for movements; camera requires display.",
    },
    {
      problem: "Permission denied on USB",
      solution:
        "On Linux, add your user to the dialout group: sudo usermod -aG dialout $USER",
    },
    {
      problem: "App doesn't appear in dashboard",
      solution:
        "Make sure you restarted the daemon after pip install. Check the Apps tab.",
    },
    {
      problem: "Robot doesn't move",
      solution:
        "Check daemon logs for errors. Verify the robot is powered (antenna LEDs on).",
    },
  ];

  return (
    <>
      <Nav />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <SignalBadge variant="cyan" pulse className="mb-4">
              quickstart
            </SignalBadge>

            <h1 className="text-3xl md:text-4xl font-mono font-bold text-[var(--text-primary)] mb-4">
              Getting Started
            </h1>

            <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
              From unboxing to your first robot movement in under 10 minutes. This
              guide covers setup, the SDK basics, and installing your first app.
            </p>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12 rounded-xl overflow-hidden border border-[var(--border-subtle)]"
          >
            <Image
              src="/media/reachy-hello.gif"
              alt="Reachy Mini waving hello"
              width={800}
              height={400}
              className="w-full h-auto"
              unoptimized
            />
          </motion.div>

          {/* Prerequisites */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-12"
          >
            <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-4">
              What You&apos;ll Need
            </h2>
            <Card className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prerequisites.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.required
                          ? "bg-[var(--accent-cyan-glow)] text-[var(--accent-cyan)]"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                      }`}
                    >
                      <Icon name={item.icon} size={18} strokeWidth={1.5} />
                    </div>
                    <span
                      className={
                        item.required
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)]"
                      }
                    >
                      {item.label}
                      {!item.required && (
                        <span className="text-[var(--text-muted)] text-sm ml-2">
                          (optional)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.section>

          {/* Steps */}
          <section className="mb-12 space-y-6">
            {steps.map((step, index) => (
              <StepCard
                key={step.number}
                step={step}
                delay={0.2 + index * 0.05}
              />
            ))}
          </section>

          {/* Troubleshooting */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-mono font-medium text-[var(--text-primary)]">
                Troubleshooting
              </h2>
              <SignalBadge variant="amber">common issues</SignalBadge>
            </div>
            <Card className="divide-y divide-[var(--border-subtle)]">
              {troubleshooting.map((item, index) => (
                <div key={index} className="p-4">
                  <p className="font-medium text-[var(--text-primary)] mb-1">
                    {item.problem}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {item.solution}
                  </p>
                </div>
              ))}
            </Card>
          </motion.section>

          {/* Next Steps */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="mb-12"
          >
            <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-4">
              Next Steps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/apps">
                <Card variant="interactive" className="p-5 h-full">
                  <div className="text-[var(--accent-cyan)] mb-3">
                    <Icon name="Layers" size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Explore Apps
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    See what others have built — Focus Guardian, DJ Reactor, and
                    more.
                  </p>
                </Card>
              </Link>
              <Link href="/timeline">
                <Card variant="interactive" className="p-5 h-full">
                  <div className="text-[var(--accent-amber)] mb-3">
                    <Icon name="GitBranch" size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Build Timeline
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Follow the journey from unboxing to working apps.
                  </p>
                </Card>
              </Link>
              <Link href="/claude">
                <Card variant="interactive" className="p-5 h-full">
                  <div className="text-[var(--semantic-success)] mb-3">
                    <Icon name="Bot" size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Claude Sessions
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    See how Claude Code helped debug and build features.
                  </p>
                </Card>
              </Link>
            </div>
          </motion.section>

          {/* Resources */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="text-center py-12 border-t border-[var(--border-subtle)]"
          >
            <p className="text-[var(--text-secondary)] mb-4">
              Need more help? Check the official resources:
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/pollen-robotics/reachy_mini"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border-default)] text-[var(--text-primary)] font-mono text-sm rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
              >
                <Icon name="Github" size={16} />
                SDK Repository
              </a>
              <a
                href="https://huggingface.co/spaces/pollen-robotics/Reachy_Mini"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border-default)] text-[var(--text-primary)] font-mono text-sm rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
              >
                <Icon name="Box" size={16} />
                Official App Store
              </a>
            </div>
          </motion.section>

          {/* Back link */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-[var(--text-muted)] hover:text-[var(--accent-cyan)] font-mono text-sm transition-colors"
            >
              &larr; back to home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
