<template>
  <q-page>
    <q-card>
      <q-card-section>
        <comp-page-header backlink="/" shownewlink="" showtitle="Login" />
      </q-card-section>
      <q-card-section>
        <div class="q-gutter-sm">
          <q-input
            outlined
            type="email"
            v-model="formData.email"
            label="Email*"
            :rules="[(val) => !!val || 'Bitte gültige Emailadresse eingeben.']"
          />
          <q-input
            outlined
            class="col col-sm-6"
            v-model="formData.password"
            label="Passwort *"
            :type="isPwd ? 'password' : 'text'"
          >
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'eva-eye-off-outline' : 'eva-eye-outline'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>
        </div>
      </q-card-section>
      <q-card-section>
        <div v-if="!user.isLoggedIn" class="row justify-center q-mt-lg">
          <p>
            Noch kein Konto?
            <span class="text-blue-10" @click="onGoTo('/profile')"
              >Registrieren</span
            >
          </p>
        </div>
      </q-card-section>
      <q-card-section>
        <q-btn @click="onSave">Login</q-btn>
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>
import { reactive, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { useUserStore } from "src/store/user";
import useUtils from "src/services/useUtils";
import useAuth from "src/services/useAuth";

/*
  Init
*/
const $q = useQuasar();
const $r = useRouter();
const { showNotify } = useUtils();
const isPwd = ref(true);
const { fbLogin } = useAuth();

/*
    use store
*/
const user = useUserStore();

/*
  Props
*/

/*
  layout
*/

/*
  data
*/
const formData = reactive({
  password: "",
  email: "",
});

const onSave = async () => {
  try {
    $q.loading.show();
    await fbLogin(formData.email, formData.password);

    $q.loading.hide();
    showNotify("info", "Du bist angemeldet.");
    $r.push("/");
  } catch (error) {
    console.log(error);
    $q.loading.hide();
    showNotify("error", error.message);
  }
};
const onReset = async () => {
  formData.email = "";
  formData.password = "";
};

/*
    functions
*/
const onGoTo = (link) => {
  $r.push(link);
};

/*
  hooks
*/
</script>
<style scoped>
#map {
  height: 400px;
}
</style>
