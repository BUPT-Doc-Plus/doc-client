<template>
  <div class="lb welcome back" :style="`z-index: ${index};`">
    <span id="t-5">■</span>
    <span id="t-6">■</span>
    <span id="t-7">■</span>
    <span id="t-8">■</span>
    <span id="t-9">■</span>
    <span id="t-10">■</span>
    <span id="t-11">■</span>
    <span id="t-12">■</span>
  </div>
</template>

<script>
export default {
  props: ["index"]
}
</script>

<style scoped>
.welcome {
  position: absolute;
  user-select: none;
  display: flex;
}
.title {
  font-size: 100px;
}
.lb {
  font-size: 15px;
  justify-content: center;
  color: rgb(168, 131, 255);
}
.back {
  transform: translate(-100px, -10px);
}
#t-5 {
  animation: fly 3.2s infinite 1.4s;
}
#t-6 {
  animation: fly 3.2s infinite 1.2s;
}
#t-7 {
  animation: fly 3.2s infinite 1.0s;
}
#t-8 {
  animation: fly 3.2s infinite 0.8s;
}
#t-9 {
  animation: fly 3.2s infinite 0.6s;
}
#t-10 {
  animation: fly 3.2s infinite 0.4s;
}
#t-11 {
  animation: fly 3.2s infinite 0.2s;
}
#t-12 {
  animation: fly 3.2s infinite 0.0s;
}
@keyframes fly {
  0% { transform: translate(0px, 0px); }
  100% { transform: translate(2000px, 0px); }
}
</style>