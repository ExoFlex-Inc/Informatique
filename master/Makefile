.ONESHELL:

SHELL := /bin/bash

VENV=venv
PRODUCT=arduino
TEST_DIR = $(PRODUCT)/test

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
	@echo 'Installing dev pip packages'
ifeq ($(OS),Windows_NT)
	@pip3 install -r requirements-pip-dev.txt >NUL 2>&1
else
	@pip3 install -r requirements-pip-dev.txt 2>&1 > /dev/null
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
