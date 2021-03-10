<template>
  <div class="full flex">
    <div class="content">
      <div class="title welcome">
        <span id="t-1">D</span>
        <span id="t-2">o</span>
        <span id="t-3">c</span>
        <span id="t-4">+</span>
      </div>
      <div class="lb welcome back">
        <span id="t-5">■</span>
        <span id="t-6">■</span>
        <span id="t-7">■</span>
        <span id="t-8">■</span>
        <span id="t-9">■</span>
        <span id="t-10">■</span>
        <span id="t-11">■</span>
        <span id="t-12">■</span>
      </div>
      <div class="lb welcome">
        {{ percent }}%
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["percent"]
};
</script>

<style scoped>
.flex {
  display: flex;
  align-items: center;
  justify-content: center;
}
.content {
  text-align: center;
}
.welcome {
  color: #666;
  user-select: none;
  display: flex;
}
.title {
  font-size: 100px;
}
.lb {
  padding-top: 2em;
  font-size: 25px;
  justify-content: center;
  color: #ddd;
}
.back {
  transform: translate(-2000px);
}
#t-1 {
  animation: dance 2s infinite 0.0s;
}
#t-2 {
  animation: dance 2s infinite 0.2s;
}
#t-3 {
  animation: dance 2s infinite 0.4s;
}
#t-4 {
  animation: dance 2s infinite 0.6s;
}
#t-5 {
  animation: fly 5s infinite 1.4s;
}
#t-6 {
  animation: fly 5s infinite 1.2s;
}
#t-7 {
  animation: fly 5s infinite 1.0s;
}
#t-8 {
  animation: fly 5s infinite 0.8s;
}
#t-9 {
  animation: fly 5s infinite 0.6s;
}
#t-10 {
  animation: fly 5s infinite 0.4s;
}
#t-11 {
  animation: fly 5s infinite 0.2s;
}
#t-12 {
  animation: fly 5s infinite 0.0s;
}
@keyframes dance {
  0% { transform: translate(0px, 0px); }
  75% { transform: translate(0px, 20px); }
  100% { transform: translate(0px, 0px); }
}
@keyframes fly {
  0% { transform: translate(0px, 0px); }
  25% { transform: translate(2000px, 0px); }
  50% { transform: translate(2000px, 0px); }
  100% { transform: translate(4000px, 0px); }
}
</style>