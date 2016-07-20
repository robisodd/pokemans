#include <pebble.h>

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);
  dict_write_end(iter);
  app_message_outbox_send();
}

static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
}

int main(void) {
  app_message_open(10, 10);
  Window *window = window_create();
  window_set_click_config_provider(window, click_config_provider);
  window_stack_push(window, true);
  app_event_loop();
}
