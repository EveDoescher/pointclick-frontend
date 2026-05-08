import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type NextNavigationMockState = {
  pathname: string;
  searchParams: URLSearchParams;
  params: Record<string, string>;
};

const nextNavigationMock = vi.hoisted(() => {
  const state: NextNavigationMockState = {
    pathname: "/",
    searchParams: new URLSearchParams(),
    params: {},
  };

  return {
    state,
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };
});

function resetNextNavigationMock() {
  nextNavigationMock.state.pathname = "/";
  nextNavigationMock.state.searchParams = new URLSearchParams();
  nextNavigationMock.state.params = {};
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  server.resetHandlers();
  resetNextNavigationMock();
});

afterAll(() => {
  server.close();
});

Object.assign(globalThis, {
  __setNextNavigationMock: (
    next: Partial<{
      pathname: string;
      searchParams: string | URLSearchParams | Record<string, string>;
      params: Record<string, string>;
    }>
  ) => {
    if (next.pathname !== undefined) {
      nextNavigationMock.state.pathname = next.pathname;
    }

    if (next.params !== undefined) {
      nextNavigationMock.state.params = next.params;
    }

    if (next.searchParams !== undefined) {
      if (next.searchParams instanceof URLSearchParams) {
        nextNavigationMock.state.searchParams = next.searchParams;
      } else if (typeof next.searchParams === "string") {
        nextNavigationMock.state.searchParams = new URLSearchParams(
          next.searchParams
        );
      } else {
        nextNavigationMock.state.searchParams = new URLSearchParams(
          next.searchParams
        );
      }
    }
  },
  __getNextNavigationMock: () => nextNavigationMock,
});

vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: nextNavigationMock.push,
      replace: nextNavigationMock.replace,
      refresh: nextNavigationMock.refresh,
      prefetch: nextNavigationMock.prefetch,
    }),
    usePathname: () => nextNavigationMock.state.pathname,
    useSearchParams: () => nextNavigationMock.state.searchParams,
    useParams: () => nextNavigationMock.state.params,
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

Element.prototype.scrollIntoView = vi.fn();

if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;

  // eslint-disable-next-line no-var
  var __setNextNavigationMock:
    | undefined
    | ((next: Partial<{
        pathname: string;
        searchParams: string | URLSearchParams | Record<string, string>;
        params: Record<string, string>;
      }>) => void);

  // eslint-disable-next-line no-var
  var __getNextNavigationMock:
    | undefined
    | (() => {
        state: NextNavigationMockState;
        push: ReturnType<typeof vi.fn>;
        replace: ReturnType<typeof vi.fn>;
        refresh: ReturnType<typeof vi.fn>;
        prefetch: ReturnType<typeof vi.fn>;
      });
}
