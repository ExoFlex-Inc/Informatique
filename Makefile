.ONESHELL:

SHELL := /bin/bash

VENV=venv
PRODUCT=arduino
TEST_DIR = $(PRODUCT)/test
OS = $(shell uname -s)

activate:# activate venv, doesnt seem to work, but compiling
	@echo 'Activating venv $(VENV)/$(PRODUCT)'

ifeq ($(OS),Windows_NT)
	@call $(VENV)/$(PRODUCT)/Scripts/activate;
else	
	@source $(VENV)/$(PRODUCT)/bin/activate;
endif

venv: # create the virtualenv for python
ifeq ($(OS),Windows_NT)
	@if not exist $(VENV)/$(PRODUCT) ( \
		echo Creating venv $(VENV)/$(PRODUCT) & \
		py -m venv $(VENV)/$(PRODUCT) & \
		call $(VENV)/$(PRODUCT)/Scripts/activate & \
		make install \
	)
else
	@if [ ! -d "$(VENV)/$(PRODUCT)" ]; then \
		echo 'Creating venv $(VENV)/$(PRODUCT)'; \
		python3 -m venv $(VENV)/$(PRODUCT); \
		source $(VENV)/$(PRODUCT)/bin/activate && make install; \
	fi
endif

install:  # install packages
ifeq ($(OS),Windows_NT) # ceedling install would need chocolatey
	@echo 'Installing dev pip packages'
	@pip3 install -r requirements-pip-dev.txt >NUL 2>&1

else ifeq ($(OS),Darwin)
	@echo 'Installing dev pip packages'
	@pip3 install -r requirements-pip-dev.txt 2>&1 > /dev/null
	@echo 'Installing macOS dependencies'
	@if ! brew list ruby > /dev/null 2>&1; then \
		brew install ruby; \
	fi
	@if ! gem list -i ceedling > /dev/null 2>&1; then \
		sudo gem install ceedling; \
	fi

else ifeq ($(OS),Linux)
	@echo 'Installing dev pip packages'
	@pip3 install -r requirements-pip-dev.txt 2>&1 > /dev/null
	@echo 'Installing Linux dependencies'
	@if ! command -v ruby >/dev/null 2>&1; then \
		sudo apt-get install ruby; \
	fi
	@if ! gem list -i ceedling > /dev/null 2>&1; then \
		sudo gem install ceedling; \
	fi
endif

test-cpp: venv # Runs unit tests in cpp.
ifeq ($(OS),Windows_NT) # Only works on PowerShell
	@call $(VENV)/$(PRODUCT)/Scripts/activate && g++ -std=c++14 -Iincludes arduino/test/*.cpp -o arduino/test/bin/tests
	@arduino\test\bin\tests.exe
else
	@source $(VENV)/$(PRODUCT)/bin/activate && g++ -std=c++14 -Iincludes arduino/test/*.cpp -o arduino/test/bin/tests.exe;
	@arduino/test/bin/tests.exe
endif

test-py: venv # Runs unit tests in python.
ifeq ($(OS),Windows_NT) # Not working on */test/*.py for windows
	@call $(VENV)/$(PRODUCT)/Scripts/activate && py -m pytest -vv arduino/test/test.py
else
	@source $(VENV)/$(PRODUCT)/bin/activate && python3 -m pytest -vv */test/*.py;
endif

test-js: venv # Runs unit tests in python.
	@cd hmi; \
		npm run test

test-ceedling: venv # Run ceedling tests

clean: # Remove every environement in venv

ifeq ($(OS),Windows_NT)
	@rmdir /s /q $(VENV)\$(PRODUCT)
else
	@rm -rf $(VENV)/$(PRODUCT)
endif

clean-all: # Remove venv folder

ifeq ($(OS),Windows_NT)
	@rmdir /s /q $(VENV)
else
	@rm -rf $(VENV)
endif

.PHONY: venv install activate clean
