import { expect, type Page, type Response } from "@playwright/test";

export function observeApi(page: Page) {
  const responses: Response[] = [];
  const failures: string[] = [];

  page.on("response", (response) => {
    if (response.url().includes("/api/v1/")) responses.push(response);
  });

  page.on("requestfailed", (request) => {
    if (!request.url().includes("/api/v1/")) return;
    const errorText = request.failure()?.errorText ?? "";

    // Navigation may cancel an in-flight request from the page being left.
    if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(errorText)) return;

    failures.push(
      `${request.method()} ${request.url()} :: ${errorText || "unknown request failure"}`,
    );
  });

  return {
    responses,
    failures,

    waitForResponse(pathFragment: string, method = "GET") {
      return page.waitForResponse(
        (response) =>
          response.url().includes(pathFragment) &&
          response.request().method() === method,
      );
    },

    async assertNoServerErrors() {
      const bad = responses
        .filter((response) => response.status() >= 500)
        .map(
          (response) =>
            `${response.status()} ${response.request().method()} ${response.url()}`,
        );

      expect([...failures, ...bad], "API network/server errors detected").toEqual([]);
    },

    async assertRequest(pathFragment: string, method?: string) {
      await expect
        .poll(() =>
          responses.some(
            (response) =>
              response.url().includes(pathFragment) &&
              (!method || response.request().method() === method),
          ),
        )
        .toBeTruthy();
    },
  };
}
