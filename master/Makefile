.ONESHELL:

ifeq ($(OS),Windows_NT)
    SHELL := cmd
else
    SHELL := /bin/bash
	OS := $(shell uname -s)
endif

VENV=venv
PRODUCT=arduino
TEST_DIR = $(PRODUCT)/test

activate:
	@echo 'Activating venv $(VENV)/$(PRODUCT)';

ifeq ($(OS),Windows_NT)
	@.\$(VENV)\$(PRODUCT)\Scripts\activate.bat
else	
	@source $(VENV)/$(PRODUCT)/bin/activate;
endif

venv: ## create the virtualenv for python. FOR MAC, make shure you have bash terminal with brew

ifeq ($(OS),Windows_NT)
	@if not exist $(VENV)/$(PRODUCT) ( \
		echo Creating venv $(VENV)/$(PRODUCT) & \
		py -m pip install --user virtualenv >NUL 2>&1 & \
		py -m venv $(VENV)/$(PRODUCT) & \
		.\$(VENV)\$(PRODUCT)\Scripts\activate.bat & \
		make install \
	)
else
	@if [ ! -d "$(VENV)/$(PRODUCT)" ]; then \
		echo 'Creating venv $(VENV)/$(PRODUCT)'; \
		python3 -m venv $(VENV)/$(PRODUCT); \
		source $(VENV)/$(PRODUCT)/bin/activate && make install; \
	fi
endif

install:  ## install product dependencies

ifeq ($(OS),Darwin)

	@echo 'Installing dev pip packages'
	@pip3 install -r requirements-pip-dev.txt 2>&1 > /dev/null

	@echo 'Installing dev npm packages'
	@while read -r package; do \
		npm install --save-dev "$$package"; \
	done < requirements-npm-dev.txt

else ifeq ($(OS),Linux)
	@echo 'Installing dev pip packages'
	@pip3 install -r requirements-pip-dev.txt 2>&1 > /dev/null

else ifeq ($(OS),Windows_NT)
	@echo 'Installing dev pip packages'
	@pip3 install -r requirements-pip-dev.txt >NUL 2>&1

endif

test-cpp: venv ## Runs unit tests in cpp.

ifeq ($(OS),Windows_NT)
	@.\$(VENV)\$(PRODUCT)\Scripts\activate.bat & \
		clang++ -std=c++14 -I arduino/test -o test $(wildcard $(TEST_DIR)/*.cpp)

else ifeq ($(OS),Darwin)

	@source $(VENV)/$(PRODUCT)/bin/activate; \
		clang++ -std=c++14 -I arduino/test -o test  $(TEST_DIR)/*.cpp

endif

test-py: venv ## Runs unit tests in python.

ifeq ($(OS),Windows_NT)
	@.\$(VENV)\$(PRODUCT)\Scripts\activate.bat & \
		python3 -m pytest -vv */test/*.py

else ifeq ($(OS),Darwin)

	@source $(VENV)/$(PRODUCT)/bin/activate; \
		python3 -m pytest -vv */test/*.py

endif

# test-js: venv ## Runs unit tests in python.

# ifeq ($(OS),Windows_NT)
# 	@.\$(VENV)\$(PRODUCT)\Scripts\activate.bat & \
# 		mocha tests/*.js

# else ifeq ($(OS),Darwin)

# 	@source $(VENV)/$(PRODUCT)/bin/activate; \
# 		mocha $(TEST_DIR)/*.js

# endif


clean:

ifeq ($(OS),Windows_NT)
	@rmdir /s /q $(VENV)\$(PRODUCT)
else
	@rm -rf $(VENV)/$(PRODUCT)
endif

clean-all:

ifeq ($(OS),Windows_NT)
	@rmdir /s /q $(VENV)
else
	@rm -rf $(VENV)
endif

.PHONY: venv install activate clean