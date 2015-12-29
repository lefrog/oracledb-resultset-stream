#!/bin/bash

export OCI_HOME=/home/pascal/devtools/oracle_instantclient_12_1
export OCI_LIB_DIR=$OCI_HOME
export OCI_INC_DIR=$OCI_HOME/sdk/include
export LD_LIBRARY_PATH=$OCI_HOME:$LD_LIBRARY_PATH


# ssh -o port=8022 -L 35002:zi1sza-dbmaster.zedisolutions.com:1521 pascall@www.oas.ca
