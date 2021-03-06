const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/IndexPage.vue") },
      {
        path: "/connection",
        component: () => import("pages/PageConnection.vue"),
      },

      {
        path: "/videochat",
        component: () => import("pages/PageVideoChat.vue"),
      },
      {
        path: "/datachannel",
        component: () => import("pages/PageDataChannel.vue"),
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
