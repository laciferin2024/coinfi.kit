<script lang="ts">
  import { onMount } from "svelte"

  interface Props {
    score: number
    size?: number
    strokeWidth?: number
    riskLevel?: "low" | "medium" | "high" | "blocked"
  }

  let {
    score = 0,
    size = 120,
    strokeWidth = 10,
    riskLevel = "medium",
  }: Props = $props()

  let displayedScore = $state(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  let strokeDashoffset = $derived(
    circumference - (displayedScore / 100) * circumference,
  )

  function getColor(risk: string) {
    switch (risk) {
      case "low":
        return "#10B981" // emerald-500
      case "medium":
        return "#EAB308" // yellow-500
      case "high":
        return "#F43F5E" // rose-500
      case "blocked":
        return "#EF4444" // red-500
      default:
        return "#71717A" // zinc-500
    }
  }

  onMount(() => {
    // Animate score
    const duration = 1500
    const start = 0
    const end = score
    const startTime = performance.now()

    function update(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)

      displayedScore = Math.round(start + (end - start) * ease)

      if (progress < 1) {
        requestAnimationFrame(update)
      }
    }

    requestAnimationFrame(update)
  })
</script>

<div
  class="relative flex items-center justify-center"
  style="width: {size}px; height: {size}px;"
>
  <!-- Background Circle -->
  <svg class="w-full h-full -rotate-90">
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke="currentColor"
      stroke-width={strokeWidth}
      class="text-zinc-800"
    />
    <!-- Progress Circle -->
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke={getColor(riskLevel)}
      stroke-width={strokeWidth}
      stroke-dasharray={circumference}
      stroke-dashoffset={strokeDashoffset}
      stroke-linecap="round"
      class="transition-all duration-300 ease-out"
    />
  </svg>

  <!-- Content -->
  <div class="absolute inset-0 flex flex-col items-center justify-center">
    <span class="text-3xl font-black italic tracking-tighter text-white">
      {displayedScore}
    </span>
    <span class="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
      Score
    </span>
  </div>
</div>
