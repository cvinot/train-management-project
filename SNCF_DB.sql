-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`gare`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`gare` (
  `id_gare` INT NOT NULL AUTO_INCREMENT,
  `nom` VARCHAR(45) NOT NULL,
  `ville` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_gare`))
ENGINE = InnoDB
AUTO_INCREMENT = 16
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `mydb`.`train`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`train` (
  `id_train` INT NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id_train`))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `mydb`.`trajet`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`trajet` (
  `id_trajet` INT NOT NULL AUTO_INCREMENT,
  `id_gare_dep` INT NOT NULL,
  `id_gare_arr` INT NOT NULL,
  `date_dep` DATE NOT NULL,
  `heure_dep` TIME NOT NULL,
  `date_arr` DATE NOT NULL,
  `heure_arr` TIME NOT NULL,
  `id_train` INT NOT NULL,
  PRIMARY KEY (`id_trajet`),
  INDEX `id_gare_dep` (`id_gare_dep` ASC) VISIBLE,
  INDEX `id_gare_arr` (`id_gare_arr` ASC) VISIBLE,
  INDEX `id_train` (`id_train` ASC) VISIBLE,
  CONSTRAINT `trajet_ibfk_1`
    FOREIGN KEY (`id_gare_dep`)
    REFERENCES `mydb`.`gare` (`id_gare`),
  CONSTRAINT `trajet_ibfk_2`
    FOREIGN KEY (`id_gare_arr`)
    REFERENCES `mydb`.`gare` (`id_gare`),
  CONSTRAINT `trajet_ibfk_3`
    FOREIGN KEY (`id_train`)
    REFERENCES `mydb`.`train` (`id_train`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `mydb`.`voiture`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`voiture` (
  `id_voiture` INT NOT NULL AUTO_INCREMENT,
  `id_train` INT NOT NULL,
  `nombre_place` INT NOT NULL,
  `numero` INT NOT NULL,
  PRIMARY KEY (`id_voiture`),
  INDEX `id_train` (`id_train` ASC) VISIBLE,
  CONSTRAINT `voiture_ibfk_1`
    FOREIGN KEY (`id_train`)
    REFERENCES `mydb`.`train` (`id_train`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 13
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `mydb`.`place`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`place` (
  `id_place` INT NOT NULL AUTO_INCREMENT,
  `numero_place` INT NOT NULL,
  `id_voiture` INT NULL DEFAULT NULL,
  `type_place` TINYINT(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id_place`),
  INDEX `id_voiture` (`id_voiture` ASC) VISIBLE,
  CONSTRAINT `place_ibfk_1`
    FOREIGN KEY (`id_voiture`)
    REFERENCES `mydb`.`voiture` (`id_voiture`)
    ON DELETE CASCADE,
  CONSTRAINT `place_ibfk_2`
    FOREIGN KEY (`id_voiture`)
    REFERENCES `mydb`.`voiture` (`id_voiture`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 601
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `mydb`.`billet`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`billet` (
  `id_billet` INT NOT NULL AUTO_INCREMENT,
  `id_trajet` INT NOT NULL,
  `prix` FLOAT NOT NULL,
  `id_place` INT NOT NULL,
  PRIMARY KEY (`id_billet`),
  INDEX `id_trajet` (`id_trajet` ASC) VISIBLE,
  INDEX `id_place` (`id_place` ASC) VISIBLE,
  CONSTRAINT `billet_ibfk_1`
    FOREIGN KEY (`id_trajet`)
    REFERENCES `mydb`.`trajet` (`id_trajet`)
    ON DELETE CASCADE,
  CONSTRAINT `billet_ibfk_2`
    FOREIGN KEY (`id_place`)
    REFERENCES `mydb`.`place` (`id_place`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 1201
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `mydb`.`reduction`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`reduction` (
  `id_reduction` INT NOT NULL AUTO_INCREMENT,
  `type_reduction` VARCHAR(45) NOT NULL,
  `age_min` INT NULL DEFAULT NULL,
  `age_max` INT NULL DEFAULT NULL,
  `J_moins` INT NULL DEFAULT NULL,
  `pourcentage` FLOAT NULL DEFAULT NULL,
  PRIMARY KEY (`id_reduction`))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `mydb`.`client`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`client` (
  `id_client` INT NOT NULL AUTO_INCREMENT,
  `nom` VARCHAR(45) NOT NULL,
  `prenom` VARCHAR(45) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `age` INT NOT NULL,
  `username` VARCHAR(20) NULL DEFAULT NULL,
  `admin` TINYINT(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id_client`))
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `mydb`.`reservation`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`reservation` (
  `id_reduction` INT NULL DEFAULT NULL,
  `id_reservation` INT NOT NULL AUTO_INCREMENT,
  `id_client` INT NOT NULL,
  `confirmation` TINYINT NOT NULL,
  PRIMARY KEY (`id_reservation`),
  INDEX `id_reduction` (`id_reduction` ASC) VISIBLE,
  INDEX `id_client` (`id_client` ASC) VISIBLE,
  CONSTRAINT `reservation_ibfk_1`
    FOREIGN KEY (`id_reduction`)
    REFERENCES `mydb`.`reduction` (`id_reduction`)
    ON DELETE SET NULL,
  CONSTRAINT `reservation_ibfk_2`
    FOREIGN KEY (`id_client`)
    REFERENCES `mydb`.`client` (`id_client`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `mydb`.`billet_reservation`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`billet_reservation` (
  `id_reservation` INT NOT NULL,
  `id_billet` INT NOT NULL,
  PRIMARY KEY (`id_reservation`, `id_billet`),
  INDEX `id_billet` (`id_billet` ASC) VISIBLE,
  CONSTRAINT `billet_reservation_ibfk_1`
    FOREIGN KEY (`id_billet`)
    REFERENCES `mydb`.`billet` (`id_billet`)
    ON DELETE CASCADE,
  CONSTRAINT `billet_reservation_ibfk_2`
    FOREIGN KEY (`id_reservation`)
    REFERENCES `mydb`.`reservation` (`id_reservation`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;

USE `mydb`;

DELIMITER $$
USE `mydb`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `mydb`.`voiture_AFTER_INSERT`
AFTER INSERT ON `mydb`.`voiture`
FOR EACH ROW
BEGIN
    set @counter = 1;
    WHILE ( @Counter <= new.nombre_place) DO
        set @type_place = 0;
        IF @counter % 2 = 0 THEN
			SET @type_place =1;
        END IF ;
        
        INSERT INTO place(id_voiture,numero_place,type_place) values (new.id_voiture,@counter,@type_place);
		SET @Counter  = @Counter  + 1;
	END WHILE;
END$$

USE `mydb`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `mydb`.`after_client_insert`
AFTER INSERT ON `mydb`.`client`
FOR EACH ROW
BEGIN
	INSERT INTO reservation(id_client, confirmation)
	VALUES(new.id_client,0);
END$$

USE `mydb`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `mydb`.`after_reservation_update`
AFTER UPDATE ON `mydb`.`reservation`
FOR EACH ROW
BEGIN
	IF NEW.confirmation = 1 THEN
		/* First, delete all reservation with billets contained by the one about to be confirmed*/
        
        delete from billet_reservation where id_billet
		IN(select * from (select id_billet from billet_reservation where id_reservation = new.id_reservation)as t)
		AND id_reservation != new.id_reservation;
    END IF;
END$$


DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
