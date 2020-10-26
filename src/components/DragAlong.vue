<template>
  <div :style="`z-index: 1; position: absolute; left: ${x - 40}px; top: ${y - 25}px;`">
    <div class="along">{{ name }}</div>
  </div>
</template>

<script>
export default {
  props: ["name", "x", "y"],
};
</script>

<style scoped>
.along {
  font-family: 'Consolas';
  font-size: 15px;
  padding: 5px;
  border-radius: 30px;
  background: rgba(0, 0, 255, 0.05);
}
</style>