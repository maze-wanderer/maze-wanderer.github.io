require(tidyverse)
require(xml2)
require(rvest)

setwd('~/Documents/Personal/wanderer')

path = 'orig/wandroid-apk/res/values/strings.xml'

x = read_xml(path)
s = x %>% xml_nodes('string')

level_grid = function(str){
  tibble(key = str_split(str, '')[[1]],
         x = rep(1:40, 16),
         y = rep(16:1, each = 40)) %>% 
    group_by(y) %>% summarise(line = paste(key, collapse=''), .groups='drop') %>% 
    .[['line']] %>% rev() %>% paste(collapse='\n') %>% 
    str_replace_all(fixed('-'), ' ')
}


d = enframe(s, name = NULL, value = 'xml') %>% 
  mutate(text = xml_text(xml),
         name = xml_attr(xml, 'name'),
         chars = nchar(text)) %>% 
  select(-xml) %>% 
  filter(str_detect(name, '[0-9]')) %>% 
  mutate(level = str_extract(name, '[0-9]+') %>% as.integer(),
         meta = str_remove(name, '[0-9]+')) %>% 
  filter(meta != 'labelTag') %>% 
  select(-name, -chars) %>% 
  pivot_wider(names_from = 'meta', values_from = text) %>% 
  mutate(screen = str_remove_all(screen, fixed('\\'))) %>% 
  mutate(chars = str_split(screen, '')) %>% 
  janitor::clean_names() %>% 
  mutate(grid = map_chr(screen, level_grid))

for(i in d$level){
  d %>% filter(level == i) %>% .[['grid']] %>% writeLines(glue::glue('wandroid-screens/screen.{formatC(i,width=2,flag="0")}.txt'))
}

d %>% select(level, chars) %>% 
  unnest(chars) %>% 
  distinct() %>% 
  group_by(chars) %>% 
  count(chars, sort = TRUE) %>% View()
  


