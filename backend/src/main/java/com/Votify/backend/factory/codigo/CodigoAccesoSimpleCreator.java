package com.Votify.backend.factory.codigo;

import java.util.Random;

import com.Votify.backend.domain.CodigoAcceso;
import com.Votify.backend.domain.CodigoAccesoSimple;

public class CodigoAccesoSimpleCreator extends CodigoAccesoCreator { // concrete creator

    @Override
    public CodigoAcceso crear() {

        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder();

        for(int i = 0; i < 6; i++){
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }

        return new CodigoAccesoSimple(sb.toString());
    }
}