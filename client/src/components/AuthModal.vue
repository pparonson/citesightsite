<template>
  <teleport to="body">
    <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="authModal">
      <div class="relative mx-auto mt-20 w-full max-w-lg h-96 shadow-lg rounded-sm bg-white">
        <div class="mt-3 text-center">
          <h3 class="mt-10 text-lg leading-6 font-medium text-gray-900">Login</h3>
          <div class="mt-10 flex flex-col items-center">
            <button
              class="btn btn-primary w-60 text-white hover:bg-purple-500 font-bold py-2 px-2 mx-2 mb-6"
              @click="login('NIP46')"
            >
              NIP46 Login (nsec.app)
            </button>
            <button
              class="btn btn-primary w-60 text-white hover:bg-orange-500 font-bold py-2 px-4 mx-2"
              @click="login('NIP07')"
            >
              NIP07 Login (browser extension)
            </button>
          </div>
          <!-- <div class="px-7 py-3"> -->
          <!--   <button -->
          <!--     class="btn btn-primary bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 mx-2 rounded-full" -->
          <!--     @click="closeModal" -->
          <!--   > -->
          <!--     Close -->
          <!--   </button> -->
          <!-- </div> -->
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { computed, defineComponent } from 'vue';
// import { storeToRefs } from "pinia";
import { useAuthStore } from '@/store/auth';

export default defineComponent({
  name: 'AuthModal',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const authStore = useAuthStore();
    const login = (method) => {
      authStore.setLoginMethod(method);
      authStore.toggleModal(false);
    };
    const closeModal = () => {
      authStore.toggleModal(false);
    };
    return {
      login,
      closeModal
    };
  },
});
</script>
