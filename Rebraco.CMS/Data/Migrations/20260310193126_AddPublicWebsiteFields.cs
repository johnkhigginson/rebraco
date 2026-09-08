using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rebraco.CMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicWebsiteFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AvailableDate",
                schema: "rebraco",
                table: "Units",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BedPrice",
                schema: "rebraco",
                table: "Units",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Deposit",
                schema: "rebraco",
                table: "Units",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FeaturedImageUrl",
                schema: "rebraco",
                table: "Units",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Features",
                schema: "rebraco",
                table: "Units",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Furnished",
                schema: "rebraco",
                table: "Units",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "GenderRestriction",
                schema: "rebraco",
                table: "Units",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                schema: "rebraco",
                table: "Units",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LeaseTerms",
                schema: "rebraco",
                table: "Units",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ParkingIncluded",
                schema: "rebraco",
                table: "Units",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PetsAllowed",
                schema: "rebraco",
                table: "Units",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PricingModel",
                schema: "rebraco",
                table: "Units",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PricingPeriod",
                schema: "rebraco",
                table: "Units",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SemesterAvailability",
                schema: "rebraco",
                table: "Units",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "UtilitiesIncluded",
                schema: "rebraco",
                table: "Units",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "BuildingAmenities",
                schema: "rebraco",
                table: "Properties",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ByuApproved",
                schema: "rebraco",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CampusProximity",
                schema: "rebraco",
                table: "Properties",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                schema: "rebraco",
                table: "Properties",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                schema: "rebraco",
                table: "Properties",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FeaturedImageUrl",
                schema: "rebraco",
                table: "Properties",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GenderRestriction",
                schema: "rebraco",
                table: "Properties",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                schema: "rebraco",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MetaDescription",
                schema: "rebraco",
                table: "Properties",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MetaTitle",
                schema: "rebraco",
                table: "Properties",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PricingPeriod",
                schema: "rebraco",
                table: "Properties",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                schema: "rebraco",
                table: "Properties",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "StartingRent",
                schema: "rebraco",
                table: "Properties",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PropertyImages",
                schema: "rebraco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropertyId = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Alt = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyImages_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalSchema: "rebraco",
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UnitImages",
                schema: "rebraco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UnitId = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Alt = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsFloorPlan = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnitImages_Units_UnitId",
                        column: x => x.UnitId,
                        principalSchema: "rebraco",
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Units_IsPublished",
                schema: "rebraco",
                table: "Units",
                column: "IsPublished");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_IsPublished",
                schema: "rebraco",
                table: "Properties",
                column: "IsPublished");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_Slug",
                schema: "rebraco",
                table: "Properties",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PropertyImages_PropertyId_SortOrder",
                schema: "rebraco",
                table: "PropertyImages",
                columns: new[] { "PropertyId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_UnitImages_UnitId_SortOrder",
                schema: "rebraco",
                table: "UnitImages",
                columns: new[] { "UnitId", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PropertyImages",
                schema: "rebraco");

            migrationBuilder.DropTable(
                name: "UnitImages",
                schema: "rebraco");

            migrationBuilder.DropIndex(
                name: "IX_Units_IsPublished",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropIndex(
                name: "IX_Properties_IsPublished",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_Slug",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "AvailableDate",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "BedPrice",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "Deposit",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "FeaturedImageUrl",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "Features",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "Furnished",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "GenderRestriction",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "LeaseTerms",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "ParkingIncluded",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "PetsAllowed",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "PricingModel",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "PricingPeriod",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "SemesterAvailability",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "UtilitiesIncluded",
                schema: "rebraco",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "BuildingAmenities",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ByuApproved",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "CampusProximity",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ContactEmail",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "FeaturedImageUrl",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "GenderRestriction",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "MetaDescription",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "MetaTitle",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "PricingPeriod",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "Slug",
                schema: "rebraco",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "StartingRent",
                schema: "rebraco",
                table: "Properties");
        }
    }
}
