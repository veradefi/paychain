-- #Dec 01, 2018

ALTER TABLE transactions ADD COLUMN callback_sent BOOLEAN DEFAULT FALSE;

alter table transactions modify column statusDescription MEDIUMTEXT default null;
