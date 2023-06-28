.ONESHELL:

SHELL := /bin/bash

VENV=venv
PRODUCT=arduino
TEST_DIR = $(PRODUCT)/test

activate:
	@echo 'Activating venv $(VENV)/$(PRODUCT)'

ifeq ($(OS),Windows_NT)
	@source $(VENV)/$(PRODUCT)/Scripts/activate;
else	
	@source $(VENV)/$(PRODUCT)/bin/activate;
endif

venv: ## create the virtualenv for python. FOR MAC, make sure you have bash terminal with brew
ifeq ($(OS),Windows_NT)
	@if [ ! -d "$(VENV)/$(PRODUCT)" ]; then \
		echo Creating venv $(VENV)/$(PRODUCT) ; \
		py -m venv $(VENV)/$(PRODUCT) ; \
		source $(VENV)/$(PRODUCT)/Scripts/activate && make install; \
	fi
else
	@if [ ! -d "$(VENV)/$(PRODUCT)" ]; then \
		echo 'Creating venv $(VENV)/$(PRODUCT)'; \
		python3 -m venv $(VENV)/$(PRODUCT); \
		source $(VENV)/$(PRODUCT)/bin/activate && make install; \
	fi
endif

install:  ## install product dependencies
	@echo 'Installing dev pip packages'
	@pip3 install -r requirements-pip-dev.txt 2>&1 > /dev/null

test-cpp: venv ## Runs unit tests in cpp.
ifeq ($(OS),Windows_NT)
	@source $(VENV)/$(PRODUCT)/Scripts/activate; \
		g++ -std=c++20 -Iincludes arduino/test/test.cpp -o arduino/test;
else ifeq ($(OS),Darwin)
	@source $(VENV)/$(PRODUCT)/bin/activate; \
		g++ -std=c++14 -I $(TEST_DIR) -o test  $(TEST_DIR)/*.cpp;
endif

test-py: venv ## Runs unit tests in python.
ifeq ($(OS),Windows_NT)
	@source $(VENV)/$(PRODUCT)/Scripts/activate; \
		py -m pytest -vv */test/*.py;
else ifeq ($(OS),Darwin)
	@source $(VENV)/$(PRODUCT)/bin/activate; \
		python3 -m pytest -vv */test/*.py;
endif

clean:
	@rm -rf $(VENV)/$(PRODUCT)

clean-all:
	@rm -rf $(VENV)

.PHONY: venv install activate clean
