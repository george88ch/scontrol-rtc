const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/IndexPage.vue") },

      {
        path: "/videochat",
        component: () => import("pages/PageVideoChat.vue"),
      },
      {
        path: "/segmentation",
        component: () => import("pages/PageSegmentation.vue"),
      },
      {
        path: "/sandbox",
        component: () => import("pages/PageSandbox.vue"),
      },
      // {
      //   path: "/rtcmaster",
      //   component: () => import("pages/PageRtcMaster.vue"),
      // },
      // {
      //   path: "/rtcslave",
      //   component: () => import("pages/PageRtcSlave.vue"),
      // },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
