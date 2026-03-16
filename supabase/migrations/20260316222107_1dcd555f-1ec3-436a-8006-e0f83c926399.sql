create type plan_type as enum ('basico', 'profissional', 'enterprise');

alter table accounts 
add column plan plan_type default 'basico',
add column max_users integer default 3;