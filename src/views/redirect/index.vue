<template>
  <div />
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const { params, query } = route
const path = params.path
if (path) {
  router.replace({
    path: '/' + (Array.isArray(path) ? path.join('/') : path),
    query,
  })
} else {
  router.replace({ path: '/', query })
}
</script>
