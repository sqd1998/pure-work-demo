// src/composables/useEventSource.ts
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { ref, onUnmounted } from "vue";

interface EventSourceOptions {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: any;
  onMessage?: (data: string) => void;
  onOpen?: (response: Response) => void;
  onError?: (err: any) => void;
}

export function useEventSource() {
  const data = ref<string>("");
  const error = ref<any>(null);
  const isLoading = ref<boolean>(false);
  let controller: AbortController | null = null;

  const fetchStream = async (options: EventSourceOptions) => {
    isLoading.value = true;
    error.value = null;
    data.value = "";

    controller = new AbortController();

    try {
      await fetchEventSource(options.url, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,

        onopen: async response => {
          if (response.ok) {
            options.onOpen?.(response);
            return;
          }
          throw new Error(
            `Failed to open stream: ${response.status} ${response.statusText}`
          );
        },

        onmessage: event => {
          if (event.data) {
            const content = event.data;
            data.value += content;
            options.onMessage?.(content);
          }
        },

        onerror: err => {
          throw err;
        },

        onclose: () => {
          isLoading.value = false;
        }
      });
    } catch (err) {
      error.value = err;
      isLoading.value = false;
    }
  };

  const abort = () => {
    if (controller) {
      controller.abort();
      isLoading.value = false;
    }
  };

  onUnmounted(() => {
    abort();
  });

  return {
    data,
    error,
    isLoading,
    fetchStream,
    abort
  };
}
